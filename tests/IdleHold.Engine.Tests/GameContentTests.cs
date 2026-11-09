using IdleHold.Engine.Content;
using IdleHold.Engine.State;

namespace IdleHold.Engine.Tests;

public class GameContentTests
{
    [Fact]
    public void Constructor_DuplicateId_Throws()
    {
        var action = new ActionDefinition("chop", "woodcutting", TimeSpan.FromSeconds(3), 10, "log");

        Assert.Throws<ArgumentException>(() => new GameContent(TestSkills.All, [action, action]));
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    public void Constructor_NonPositiveDuration_Throws(int seconds)
    {
        var action = new ActionDefinition("chop", "woodcutting", TimeSpan.FromSeconds(seconds), 10, "log");

        Assert.Throws<ArgumentException>(() => new GameContent(TestSkills.All, [action]));
    }

    [Fact]
    public void Constructor_InputWithNonPositiveQuantity_Throws()
    {
        var action = new ActionDefinition("saw", "crafting", TimeSpan.FromSeconds(3), 10, "plank") { Inputs = [new ItemAmount("log", 0)] };

        Assert.Throws<ArgumentException>(() => new GameContent(TestSkills.All, [action]));
    }

    [Fact]
    public void Constructor_SameInputTwice_Throws()
    {
        var action = new ActionDefinition("saw", "crafting", TimeSpan.FromSeconds(3), 10, "plank")
        {
            Inputs = [new ItemAmount("log", 1), new ItemAmount("log", 2)],
        };

        Assert.Throws<ArgumentException>(() => new GameContent(TestSkills.All, [action]));
    }

    [Fact]
    public void Constructor_ToolRecipeMakingMoreThanOne_Throws()
    {
        var action = new ActionDefinition("craft-axe", "crafting", TimeSpan.FromSeconds(3), 10, "axe", OutputQuantity: 2);

        Assert.Throws<ArgumentException>(() => new GameContent(TestSkills.All, [action], [new ToolDefinition("axe", "axe", 1, "woodcutting")]));
    }

    [Fact]
    public void Constructor_ToolsOfOneFamilyServingDifferentTrades_Throws()
    {
        Assert.Throws<ArgumentException>(() => new GameContent(
            TestSkills.All,
            [],
            [new ToolDefinition("axe", "axe", 1, "woodcutting"), new ToolDefinition("good-axe", "axe", 2, "mining")]));
    }

    [Fact]
    public void DefaultContent_EveryToolServesATradeWithActions()
    {
        var content = DefaultContent.Create();

        Assert.All(content.Tools, tool => Assert.Contains(content.Actions, action => action.SkillId == tool.SkillId));
    }

    [Fact]
    public void Constructor_TwoToolsWithTheSameFamilyAndTier_Throws()
    {
        Assert.Throws<ArgumentException>(() => new GameContent(
            TestSkills.All,
            [],
            [new ToolDefinition("axe", "axe", 1, "woodcutting"), new ToolDefinition("other-axe", "axe", 1, "woodcutting")]));
    }

    [Fact]
    public void DefaultContent_IsValid()
    {
        var content = DefaultContent.Create();

        Assert.NotEmpty(content.Actions);
    }

    [Fact]
    public void DefaultContent_HasExpectedActionsPerSkill()
    {
        var bySkill = DefaultContent.Create().Actions
            .GroupBy(action => action.SkillId)
            .ToDictionary(group => group.Key, group => group.Count());

        Assert.Equal(
            new Dictionary<string, int> { ["foraging"] = 4, ["woodcutting"] = 3, ["fishing"] = 2, ["mining"] = 2, ["crafting"] = 4, ["carpentry"] = 1, ["cooking"] = 2 },
            bySkill);
    }

    [Theory]
    [InlineData("gather-twigs")]
    [InlineData("pick-pebbles")]
    public void DefaultContent_TheFirstAxeIsGatheredByHand(string actionId)
    {
        // Foraging is the bare-hand trade, and it gathers what the first axe is made of.
        var content = DefaultContent.Create();

        Assert.Equal("foraging", content.GetAction(actionId).SkillId);
        Assert.Contains(
            content.GetAction("craft-chipped-stone-axe").Inputs,
            input => input.ItemId == content.GetAction(actionId).OutputItemId);
    }

    [Fact]
    public void DefaultContent_EveryLockedTradeCanBeOpened()
    {
        // Each tool that opens a trade is made in a trade that is open from the start, or that an earlier tool opens.
        var content = DefaultContent.Create();
        var engine = new GameEngine(content);
        var open = content.Skills.Select(skill => skill.Id).Where(id => engine.MissingToolFor(GameState.New, id) is null).ToHashSet();

        var opened = true;
        while (opened)
        {
            opened = false;
            foreach (var tool in content.Tools.Where(tool => !open.Contains(tool.SkillId)))
            {
                var recipe = content.FindRecipeFor(tool.ItemId);
                if (recipe is not null && open.Contains(recipe.SkillId) && recipe.Inputs.All(input => open.Contains(content.FindRecipeFor(input.ItemId)!.SkillId)))
                {
                    opened = open.Add(tool.SkillId);
                }
            }
        }

        Assert.Equal(content.Skills.Select(skill => skill.Id).ToHashSet(), open);
    }

    [Fact]
    public void DefaultContent_BareHandsReachMiningThroughEachTool()
    {
        // The first minutes, played on the real content: each step uses what the one before it made.
        var content = DefaultContent.Create();
        var engine = new GameEngine(content);
        var state = GameState.New;

        GameState Work(string actionId, int times)
        {
            var started = engine.StartAction(state, actionId);
            return engine.StopAction(engine.Tick(started, content.GetAction(actionId).Duration * times));
        }

        state = Work("gather-twigs", 3);
        state = Work("pick-pebbles", 10);
        state = Work("pull-reeds", 3);
        Assert.Equal("chipped-stone-axe", engine.MissingToolFor(state, "woodcutting"));

        state = Work("craft-chipped-stone-axe", 1);
        state = Work("cut-young-hazel", 3);
        Assert.Equal("chipped-stone-knife", engine.MissingToolFor(state, "carpentry"));

        state = Work("craft-chipped-stone-knife", 1);
        state = Work("whittle-hazel-sticks", 2);
        Assert.Equal(4, state.ItemCount("hazel-stick"));
        Assert.Equal("chipped-stone-pickaxe", engine.MissingToolFor(state, "mining"));

        state = Work("craft-chipped-stone-pickaxe", 1);
        Assert.Null(engine.MissingToolFor(state, "mining"));

        // The rod is handled with hazel sticks too.
        state = Work("cut-young-hazel", 2);
        state = Work("whittle-hazel-sticks", 2);
        state = Work("pull-reeds", 4);
        state = Work("craft-reed-fishing-rod", 1);
        Assert.Equal([new TradeLock("cooking", null, "campfire")], engine.LockedTradesOf(state));

        // Lighting the campfire, from Foraging alone, opens the last trade.
        state = Work("gather-twigs", 10);
        state = Work("pull-reeds", 5);
        state = Work("pick-pebbles", 8);
        state = engine.Build(state, "campfire");
        Assert.Empty(engine.LockedTradesOf(state));
    }

    [Theory]
    [InlineData("cut-young-hazel", 1)]
    [InlineData("cut-pine", 15)]
    [InlineData("cut-birch", 30)]
    public void DefaultContent_TreesOpenWithWoodcuttingLevels(string actionId, int level)
    {
        Assert.Equal(level, DefaultContent.Create().GetAction(actionId).RequiredLevel);
    }

    [Fact]
    public void DefaultContent_CookingBurnsLogs_AndALogFromALaterTreeBurnsLonger()
    {
        var content = DefaultContent.Create();

        Assert.All(content.Actions.Where(action => action.SkillId == "cooking"), action => Assert.True(action.UsesFuel));
        Assert.Equal(["hazel-log", "pine-log", "birch-log"], content.Fuels.Select(fuel => fuel.ItemId));
        Assert.Equal(content.Fuels.Select(fuel => fuel.Cycles).Order(), content.Fuels.Select(fuel => fuel.Cycles));
    }

    [Fact]
    public void Constructor_FirstToolMadeInTheTradeItOpens_Throws()
    {
        var makeAxe = new ActionDefinition("make-axe", "woodcutting", TimeSpan.FromSeconds(5), 10, "axe");

        Assert.Throws<ArgumentException>(() => new GameContent(TestSkills.All, [makeAxe], [new ToolDefinition("axe", "axe", 1, "woodcutting")]));
    }

    [Fact]
    public void Constructor_UpgradeMadeInTheTradeItServes_IsAllowed()
    {
        // Only the first tier opens the trade; a better one can be made inside it.
        var content = new GameContent(
            TestSkills.All,
            [
                new ActionDefinition("make-axe", "crafting", TimeSpan.FromSeconds(5), 10, "axe"),
                new ActionDefinition("make-good-axe", "woodcutting", TimeSpan.FromSeconds(5), 10, "good-axe"),
            ],
            [new ToolDefinition("axe", "axe", 1, "woodcutting"), new ToolDefinition("good-axe", "axe", 2, "woodcutting")]);

        Assert.Equal(2, content.Actions.Count);
    }

    [Fact]
    public void DefaultContent_SlowerActionsPayMoreXpPerSecond()
    {
        // Within a skill, waiting longer must be worth it; otherwise the slow action is a trap.
        foreach (var skill in DefaultContent.Create().Actions.GroupBy(action => action.SkillId))
        {
            var ordered = skill.OrderBy(action => action.Duration).ToList();
            var rates = ordered.Select(action => action.XpPerCompletion / action.Duration.TotalSeconds).ToList();

            Assert.True(
                rates.SequenceEqual(rates.Order()),
                $"In {skill.Key}, slower actions should not give less XP per second.");
        }
    }

    [Fact]
    public void DefaultContent_RecipesUseItemsThePlayerCanGather()
    {
        // Every input must come out of some action, or the recipe can never be made.
        var content = DefaultContent.Create();
        var produced = content.Actions.Select(action => action.OutputItemId).ToHashSet();

        Assert.All(
            content.Actions.SelectMany(action => action.Inputs),
            input => Assert.Contains(input.ItemId, produced));
    }

    [Fact]
    public void DefaultContent_EveryToolHasARecipe()
    {
        var content = DefaultContent.Create();

        Assert.All(content.Tools, tool => Assert.Contains(content.Actions, action => action.OutputItemId == tool.ItemId));
    }

    [Fact]
    public void Constructor_DuplicateSkill_Throws()
    {
        var skill = new SkillDefinition("woodcutting", SkillCategory.Gathering);

        Assert.Throws<ArgumentException>(() => new GameContent([skill, skill], []));
    }

    [Fact]
    public void Constructor_SkillWithUnknownCategory_Throws()
    {
        Assert.Throws<ArgumentException>(() => new GameContent([new SkillDefinition("woodcutting", (SkillCategory)99)], []));
    }

    [Fact]
    public void Constructor_ActionOfAnUnknownSkill_Throws()
    {
        var action = new ActionDefinition("chop", "lumberjacking", TimeSpan.FromSeconds(3), 10, "log");

        Assert.Throws<ArgumentException>(() => new GameContent(TestSkills.All, [action]));
    }

    [Fact]
    public void Constructor_ToolForAnUnknownSkill_Throws()
    {
        Assert.Throws<ArgumentException>(() => new GameContent(
            TestSkills.All,
            [],
            [new ToolDefinition("rod", "fishing-rod", 1, "fishing")]));
    }

    [Fact]
    public void Skills_KeepTheOrderTheyWereGiven()
    {
        var content = new GameContent(TestSkills.All, []);

        Assert.Equal(["woodcutting", "mining", "crafting"], content.Skills.Select(skill => skill.Id));
    }

    [Theory]
    [InlineData("woodcutting", SkillCategory.Gathering)]
    [InlineData("fishing", SkillCategory.Gathering)]
    [InlineData("mining", SkillCategory.Gathering)]
    [InlineData("foraging", SkillCategory.Gathering)]
    [InlineData("crafting", SkillCategory.Production)]
    public void DefaultContent_GroupsEveryTrade(string skillId, SkillCategory category)
    {
        var skill = Assert.Single(DefaultContent.Create().Skills, skill => skill.Id == skillId);

        Assert.Equal(category, skill.Category);
    }
    [Fact]
    public void ItemIds_ListOutputsBeforeInputs_InActionOrder_Once()
    {
        var content = new GameContent(TestSkills.All,
        [
            new ActionDefinition("chop", "woodcutting", TimeSpan.FromSeconds(3), 10, "log"),
            new ActionDefinition("saw", "crafting", TimeSpan.FromSeconds(5), 4, "plank") { Inputs = [new ItemAmount("log", 3), new ItemAmount("nail", 1)] },
            new ActionDefinition("mine", "mining", TimeSpan.FromSeconds(4), 7, "ore"),
        ]);

        Assert.Equal(["log", "plank", "nail", "ore"], content.ItemIds);
    }

    [Theory]
    [InlineData(0, 10)]
    [InlineData(3, 0)]
    public void Storage_NeedsASlotAndAStack(int slots, long stackSize)
    {
        Assert.Throws<ArgumentException>(() => new GameContent(TestSkills.All, [], storage: new StorageRules(slots, stackSize)));
    }
}
