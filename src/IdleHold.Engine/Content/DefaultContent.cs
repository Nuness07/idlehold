namespace IdleHold.Engine.Content;

/// <summary>
/// The content the real game ships with. Hard-coded for now; it will move to data files later.
/// The player starts with bare hands: Foraging is the one gathering trade worked by hand, and a trade that a tool
/// serves (Woodcutting the axe, Carpentry the knife, Mining the pickaxe, Fishing the rod) stays locked until that
/// tool is made. Each tree, fishing spot and rock then pays more XP per second the slower it is.
/// Crafting turns what the trades gather into tools, and each tool opens the next step: twigs and pebbles make the
/// axe, the axe cuts the young hazel, a hazel log handles the knife, the knife whittles hazel sticks in Carpentry,
/// and the sticks handle the pickaxe. Tools are unique and upgraded by tier, so each tool recipe can be made once
/// (see <see cref="ToolDefinition"/>).
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
    ],
    [
        // Foraging: the bare-hand trade, and the only one open from the start besides Crafting.
        new ActionDefinition("gather-twigs", "foraging", TimeSpan.FromSeconds(2), XpPerCompletion: 5, OutputItemId: "twig"),
        new ActionDefinition("pick-pebbles", "foraging", TimeSpan.FromSeconds(2), XpPerCompletion: 5, OutputItemId: "pebble"),
        new ActionDefinition("pick-wild-berries", "foraging", TimeSpan.FromSeconds(2), XpPerCompletion: 5, OutputItemId: "wild-berry"),
        new ActionDefinition("pull-reeds", "foraging", TimeSpan.FromSeconds(3), XpPerCompletion: 8, OutputItemId: "reed"),

        // Woodcutting: locked until the axe. The young hazel is the first tree: thin and quick to cut.
        new ActionDefinition("cut-young-hazel", "woodcutting", TimeSpan.FromSeconds(2), XpPerCompletion: 6, OutputItemId: "hazel-log"),
        new ActionDefinition("cut-pine", "woodcutting", TimeSpan.FromSeconds(3), XpPerCompletion: 10, OutputItemId: "pine-log"),
        new ActionDefinition("cut-birch", "woodcutting", TimeSpan.FromSeconds(5), XpPerCompletion: 18, OutputItemId: "birch-log"),

        // Fishing: locked until the rod.
        new ActionDefinition("catch-perch", "fishing", TimeSpan.FromSeconds(4), XpPerCompletion: 12, OutputItemId: "perch"),
        new ActionDefinition("catch-pike", "fishing", TimeSpan.FromSeconds(7), XpPerCompletion: 28, OutputItemId: "pike"),

        // Mining: locked until the pickaxe.
        new ActionDefinition("mine-stone", "mining", TimeSpan.FromSeconds(3), XpPerCompletion: 9, OutputItemId: "stone"),
        new ActionDefinition("mine-copper", "mining", TimeSpan.FromSeconds(6), XpPerCompletion: 22, OutputItemId: "copper-ore"),

        // Crafting: the first tools. Each takes a while and pays well, because it is made only once.
        new ActionDefinition("craft-chipped-stone-axe", "crafting", TimeSpan.FromSeconds(30), XpPerCompletion: 40, OutputItemId: "chipped-stone-axe")
        {
            Inputs = [new ItemAmount("twig", 3), new ItemAmount("pebble", 2)],
        },
        new ActionDefinition("craft-chipped-stone-knife", "crafting", TimeSpan.FromSeconds(20), XpPerCompletion: 26, OutputItemId: "chipped-stone-knife")
        {
            Inputs = [new ItemAmount("hazel-log", 1), new ItemAmount("pebble", 3)],
        },
        new ActionDefinition("craft-chipped-stone-pickaxe", "crafting", TimeSpan.FromSeconds(35), XpPerCompletion: 47, OutputItemId: "chipped-stone-pickaxe")
        {
            // The reeds lash the stone head to the handle.
            Inputs = [new ItemAmount("hazel-stick", 4), new ItemAmount("pebble", 5), new ItemAmount("reed", 3)],
        },
        new ActionDefinition("craft-reed-fishing-rod", "crafting", TimeSpan.FromSeconds(40), XpPerCompletion: 55, OutputItemId: "reed-fishing-rod")
        {
            Inputs = [new ItemAmount("pine-log", 2), new ItemAmount("reed", 4)],
        },

        // Carpentry: locked until the knife. Wood shaped into parts; repeatable, unlike a tool.
        new ActionDefinition("whittle-hazel-sticks", "carpentry", TimeSpan.FromSeconds(3), XpPerCompletion: 8, OutputItemId: "hazel-stick", OutputQuantity: 2)
        {
            Inputs = [new ItemAmount("hazel-log", 1)],
        },
    ],
    [
        new ToolDefinition("chipped-stone-axe", Family: "axe", Tier: 1, SkillId: "woodcutting"),
        new ToolDefinition("chipped-stone-knife", Family: "knife", Tier: 1, SkillId: "carpentry"),
        new ToolDefinition("chipped-stone-pickaxe", Family: "pickaxe", Tier: 1, SkillId: "mining"),
        new ToolDefinition("reed-fishing-rod", Family: "fishing-rod", Tier: 1, SkillId: "fishing"),
    ],
    Storage);

    /// <summary>
    /// The storehouse a hold starts with: 48 slots of up to 10,000 of one item each (a day of chopping pine fills
    /// about one). Bags will add slots. A first try, to tune once the limit is played.
    /// </summary>
    public static StorageRules Storage { get; } = new(SlotCount: 48, StackSize: 10_000);
}
