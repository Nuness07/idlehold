namespace IdleHold.Engine.Content;

/// <summary>
/// The content the real game ships with. Hard-coded for now; it will move to data files later.
/// The player starts with bare hands: Foraging is the one gathering trade worked by hand, and a trade that a tool
/// serves (Woodcutting the axe, Carpentry the knife, Mining the pickaxe, Fishing the rod) stays locked until that
/// tool is made. Inside a trade, better actions open with levels (the pine at Woodcutting 15, the birch at 30), and
/// each tree, fishing spot and rock pays more XP per second the slower it is.
/// Crafting turns what the trades gather into tools, and each tool opens the next step: twigs and pebbles make the
/// axe, the axe cuts the young hazel, a hazel log handles the knife, the knife whittles hazel sticks in Carpentry,
/// and the sticks handle the pickaxe. Tools are unique and upgraded by tier, so each tool recipe can be made once
/// (see <see cref="ToolDefinition"/>). Cooking opens once the campfire is lit in the village (see <see cref="BuildingDefinition"/>); it needs no tool but burns logs: the player picks which, and each kind
/// lasts a number of dishes (see <see cref="FuelDefinition"/>).
/// Crafting sorts its recipes by material and Cooking by station (see <see cref="RecipeGroupDefinition"/>).
/// </summary>
public static class DefaultContent
{
    public static GameContent Create() => new(
    [
        new SkillDefinition("foraging", SkillCategory.Gathering),
        new SkillDefinition("woodcutting", SkillCategory.Gathering),
        new SkillDefinition("fishing", SkillCategory.Gathering),
        new SkillDefinition("mining", SkillCategory.Gathering),
        new SkillDefinition("crafting", SkillCategory.Production),
        new SkillDefinition("carpentry", SkillCategory.Production),
        new SkillDefinition("cooking", SkillCategory.Production) { RequiredBuildingId = "campfire" },
    ],
    [
        // Foraging: the bare-hand trade, and the only one open from the start besides Crafting.
        new ActionDefinition("gather-twigs", "foraging", TimeSpan.FromSeconds(2), XpPerCompletion: 5, OutputItemId: "twig"),
        new ActionDefinition("pick-pebbles", "foraging", TimeSpan.FromSeconds(2), XpPerCompletion: 5, OutputItemId: "pebble"),
        new ActionDefinition("pick-wild-berries", "foraging", TimeSpan.FromSeconds(2), XpPerCompletion: 5, OutputItemId: "wild-berry"),
        new ActionDefinition("pull-reeds", "foraging", TimeSpan.FromSeconds(3), XpPerCompletion: 8, OutputItemId: "reed"),

        // Woodcutting: locked until the axe. The young hazel is the first tree: thin and quick to cut.
        new ActionDefinition("cut-young-hazel", "woodcutting", TimeSpan.FromSeconds(2), XpPerCompletion: 6, OutputItemId: "hazel-log"),
        new ActionDefinition("cut-pine", "woodcutting", TimeSpan.FromSeconds(3), XpPerCompletion: 10, OutputItemId: "pine-log") { RequiredLevel = 15 },
        new ActionDefinition("cut-birch", "woodcutting", TimeSpan.FromSeconds(5), XpPerCompletion: 18, OutputItemId: "birch-log") { RequiredLevel = 30 },

        // Fishing: locked until the rod.
        new ActionDefinition("catch-perch", "fishing", TimeSpan.FromSeconds(4), XpPerCompletion: 12, OutputItemId: "perch"),
        new ActionDefinition("catch-pike", "fishing", TimeSpan.FromSeconds(7), XpPerCompletion: 28, OutputItemId: "pike"),

        // Mining: locked until the pickaxe.
        new ActionDefinition("mine-stone", "mining", TimeSpan.FromSeconds(3), XpPerCompletion: 9, OutputItemId: "stone"),
        new ActionDefinition("mine-copper", "mining", TimeSpan.FromSeconds(6), XpPerCompletion: 22, OutputItemId: "copper-ore"),

        // Crafting: the first tools. Each takes a while and pays well, because it is made only once.
        new ActionDefinition("craft-chipped-stone-axe", "crafting", TimeSpan.FromSeconds(30), XpPerCompletion: 40, OutputItemId: "chipped-stone-axe")
        {
            GroupId = "chipped-stone",
            Inputs = [new ItemAmount("twig", 3), new ItemAmount("pebble", 2)],
        },
        new ActionDefinition("craft-chipped-stone-knife", "crafting", TimeSpan.FromSeconds(20), XpPerCompletion: 26, OutputItemId: "chipped-stone-knife")
        {
            GroupId = "chipped-stone",
            Inputs = [new ItemAmount("hazel-log", 1), new ItemAmount("pebble", 3)],
        },
        new ActionDefinition("craft-chipped-stone-pickaxe", "crafting", TimeSpan.FromSeconds(35), XpPerCompletion: 47, OutputItemId: "chipped-stone-pickaxe")
        {
            GroupId = "chipped-stone",
            // The reeds lash the stone head to the handle.
            Inputs = [new ItemAmount("hazel-stick", 4), new ItemAmount("pebble", 5), new ItemAmount("reed", 3)],
        },
        new ActionDefinition("craft-reed-fishing-rod", "crafting", TimeSpan.FromSeconds(40), XpPerCompletion: 55, OutputItemId: "reed-fishing-rod")
        {
            GroupId = "chipped-stone",
            Inputs = [new ItemAmount("hazel-stick", 3), new ItemAmount("reed", 4)],
        },

        // Carpentry: locked until the knife. Wood shaped into parts; repeatable, unlike a tool.
        new ActionDefinition("whittle-hazel-sticks", "carpentry", TimeSpan.FromSeconds(3), XpPerCompletion: 8, OutputItemId: "hazel-stick", OutputQuantity: 2)
        {
            Inputs = [new ItemAmount("hazel-log", 1)],
        },

        // Cooking: opens once the campfire is lit; every dish burns fuel, and logs need the axe.
        new ActionDefinition("cook-grilled-berries", "cooking", TimeSpan.FromSeconds(3), XpPerCompletion: 8, OutputItemId: "grilled-berries")
        {
            GroupId = "campfire",
            Inputs = [new ItemAmount("wild-berry", 4)],
            UsesFuel = true,
        },
        new ActionDefinition("cook-berry-soup", "cooking", TimeSpan.FromSeconds(6), XpPerCompletion: 20, OutputItemId: "berry-soup")
        {
            GroupId = "campfire",
            Inputs = [new ItemAmount("wild-berry", 12)],
            UsesFuel = true,
        },
    ],
    [
        new ToolDefinition("chipped-stone-axe", Family: "axe", Tier: 1, SkillId: "woodcutting"),
        new ToolDefinition("chipped-stone-knife", Family: "knife", Tier: 1, SkillId: "carpentry"),
        new ToolDefinition("chipped-stone-pickaxe", Family: "pickaxe", Tier: 1, SkillId: "mining"),
        new ToolDefinition("reed-fishing-rod", Family: "fishing-rod", Tier: 1, SkillId: "fishing"),
    ],
    Storage,
    [
        // A thicker log burns longer.
        new FuelDefinition("hazel-log", Cycles: 2),
        new FuelDefinition("pine-log", Cycles: 4),
        new FuelDefinition("birch-log", Cycles: 6),
    ],
    [
        // Crafting by material, each a step up. Only chipped stone has recipes yet; the rest show what is coming.
        new RecipeGroupDefinition("chipped-stone", "crafting"),
        new RecipeGroupDefinition("stone", "crafting"),
        new RecipeGroupDefinition("copper", "crafting"),

        // Cooking by station: the campfire now, the stone furnace (better dishes) later.
        new RecipeGroupDefinition("campfire", "cooking"),
        new RecipeGroupDefinition("stone-furnace", "cooking"),
    ],
    [
        // The first thing the village needs: a ring of pebbles, dry reeds to catch the spark and twigs to feed it.
        // Lighting it opens Cooking.
        new BuildingDefinition("campfire", [new ItemAmount("twig", 10), new ItemAmount("reed", 5), new ItemAmount("pebble", 8)]),
    ]);

    /// <summary>
    /// The storehouse a hold starts with: 48 slots of up to 10,000 of one item each (a day of chopping pine fills
    /// about one). Bags will add slots. A first try, to tune once the limit is played.
    /// </summary>
    public static StorageRules Storage { get; } = new(SlotCount: 48, StackSize: 10_000);
}
