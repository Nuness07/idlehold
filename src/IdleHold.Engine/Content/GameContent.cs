namespace IdleHold.Engine.Content;

/// <summary>
/// The static catalog of the game: skills, actions, tools and fuels (and later items).
/// It is validated once at construction so the engine can trust it afterwards.
/// </summary>
public sealed class GameContent
{
    private readonly List<SkillDefinition> _skills = [];
    private readonly Dictionary<string, ActionDefinition> _actions = new(StringComparer.Ordinal);
    private readonly Dictionary<string, ToolDefinition> _tools = new(StringComparer.Ordinal);
    private readonly Dictionary<string, FuelDefinition> _fuels = new(StringComparer.Ordinal);

    public GameContent(
        IEnumerable<SkillDefinition> skills,
        IEnumerable<ActionDefinition> actions,
        IEnumerable<ToolDefinition>? tools = null,
        StorageRules? storage = null,
        IEnumerable<FuelDefinition>? fuels = null)
    {
        Storage = storage ?? StorageRules.Unlimited;
        if (Storage.SlotCount < 1 || Storage.StackSize < 1)
        {
            throw new ArgumentException("The storehouse needs at least one slot and a stack size of at least one.", nameof(storage));
        }

        foreach (var skill in skills)
        {
            AddSkill(skill);
        }

        foreach (var tool in tools ?? [])
        {
            AddTool(tool);
        }

        foreach (var action in actions)
        {
            AddAction(action);
        }

        ItemIds = _actions.Values
            .SelectMany(action => action.Inputs.Select(input => input.ItemId).Prepend(action.OutputItemId))
            .Distinct()
            .ToList();

        foreach (var fuel in fuels ?? [])
        {
            AddFuel(fuel);
        }
    }

    /// <summary>How the storehouse holds items: its slots and how much one slot holds.</summary>
    public StorageRules Storage { get; }

    /// <summary>
    /// Every item, in the order the game lists them: action by action, each action's output before its inputs.
    /// There is no separate item list: an item is anything an action makes or uses. Tools are items too.
    /// </summary>
    public IReadOnlyList<string> ItemIds { get; }

    /// <summary>Every skill, in the order the game lists them.</summary>
    public IReadOnlyList<SkillDefinition> Skills => _skills;

    public IReadOnlyCollection<ActionDefinition> Actions => _actions.Values;

    public IReadOnlyCollection<ToolDefinition> Tools => _tools.Values;

    /// <summary>Every fuel, in the order the game lists them.</summary>
    public IReadOnlyCollection<FuelDefinition> Fuels => _fuels.Values;

    /// <summary>Returns the fuel this item is, or <c>null</c> if the item cannot feed a fire.</summary>
    public FuelDefinition? FindFuel(string itemId) =>
        _fuels.GetValueOrDefault(itemId);

    /// <summary>Returns the action with this id, or <c>null</c> if it does not exist.</summary>
    public ActionDefinition? FindAction(string id) =>
        _actions.GetValueOrDefault(id);

    /// <summary>Returns the action with this id, or throws if it does not exist.</summary>
    public ActionDefinition GetAction(string id) =>
        FindAction(id) ?? throw new KeyNotFoundException($"Unknown action '{id}'.");

    /// <summary>Returns the tool this item is, or <c>null</c> if the item is not a tool.</summary>
    public ToolDefinition? FindTool(string itemId) =>
        _tools.GetValueOrDefault(itemId);

    /// <summary>Returns the first action that makes this item, or <c>null</c> if none does.</summary>
    public ActionDefinition? FindRecipeFor(string itemId) =>
        _actions.Values.FirstOrDefault(action => action.OutputItemId == itemId);

    private void AddSkill(SkillDefinition skill)
    {
        if (!Enum.IsDefined(skill.Category))
        {
            throw new ArgumentException($"Skill '{skill.Id}' has an unknown category.", "skills");
        }

        if (_skills.Any(other => other.Id == skill.Id))
        {
            throw new ArgumentException($"Duplicate skill '{skill.Id}'.", "skills");
        }

        _skills.Add(skill);
    }

    private bool HasSkill(string id) => _skills.Any(skill => skill.Id == id);

    private void AddTool(ToolDefinition tool)
    {
        if (!HasSkill(tool.SkillId))
        {
            throw new ArgumentException($"Tool '{tool.ItemId}' serves the unknown skill '{tool.SkillId}'.", "tools");
        }

        if (tool.Tier < 1)
        {
            throw new ArgumentException($"Tool '{tool.ItemId}' must have a tier of at least 1.", "tools");
        }

        if (_tools.Values.Any(other => other.Family == tool.Family && other.Tier == tool.Tier))
        {
            throw new ArgumentException($"Two '{tool.Family}' tools share tier {tool.Tier}.", "tools");
        }

        if (_tools.Values.Any(other => other.Family == tool.Family && other.SkillId != tool.SkillId))
        {
            throw new ArgumentException($"The '{tool.Family}' tools must all serve the same trade.", "tools");
        }

        if (!_tools.TryAdd(tool.ItemId, tool))
        {
            throw new ArgumentException($"Duplicate tool '{tool.ItemId}'.", "tools");
        }
    }

    private void AddFuel(FuelDefinition fuel)
    {
        if (!ItemIds.Contains(fuel.ItemId))
        {
            throw new ArgumentException($"Fuel '{fuel.ItemId}' is not an item any action makes or uses.", "fuels");
        }

        if (fuel.Cycles < 1)
        {
            throw new ArgumentException($"Fuel '{fuel.ItemId}' must burn for at least one cycle.", "fuels");
        }

        if (_actions.Values.Any(action => action.UsesFuel && (action.OutputItemId == fuel.ItemId || action.Inputs.Any(input => input.ItemId == fuel.ItemId))))
        {
            throw new ArgumentException($"Fuel '{fuel.ItemId}' is made or used by an action that burns fuel.", "fuels");
        }

        if (!_fuels.TryAdd(fuel.ItemId, fuel))
        {
            throw new ArgumentException($"Duplicate fuel '{fuel.ItemId}'.", "fuels");
        }
    }

    private void AddAction(ActionDefinition action)
    {
        if (!HasSkill(action.SkillId))
        {
            throw new ArgumentException($"Action '{action.Id}' belongs to the unknown skill '{action.SkillId}'.", "actions");
        }

        if (action.Duration <= TimeSpan.Zero)
        {
            throw new ArgumentException($"Action '{action.Id}' must have a positive duration.", "actions");
        }

        if (action.RequiredLevel is < 1 or > Experience.MaxLevel)
        {
            throw new ArgumentException($"Action '{action.Id}' must require a level from 1 to {Experience.MaxLevel}.", "actions");
        }

        if (action.OutputQuantity <= 0)
        {
            throw new ArgumentException($"Action '{action.Id}' must produce at least one item.", "actions");
        }

        // A tool is unique, so a recipe that makes one makes exactly one.
        if (_tools.ContainsKey(action.OutputItemId) && action.OutputQuantity != 1)
        {
            throw new ArgumentException($"Action '{action.Id}' makes a tool and must produce exactly one.", "actions");
        }

        // A trade is locked until its tool exists, so the first tier must be made somewhere else.
        if (_tools.GetValueOrDefault(action.OutputItemId) is { } made
            && made.SkillId == action.SkillId
            && _tools.Values.Where(tool => tool.Family == made.Family).Min(tool => tool.Tier) == made.Tier)
        {
            throw new ArgumentException($"Action '{action.Id}' makes the tool that opens its own trade, so it could never start.", "actions");
        }

        if (action.Inputs.Any(input => input.Quantity <= 0))
        {
            throw new ArgumentException($"Action '{action.Id}' must use a positive quantity of every input.", "actions");
        }

        if (action.Inputs.DistinctBy(input => input.ItemId).Count() != action.Inputs.Count)
        {
            throw new ArgumentException($"Action '{action.Id}' lists an input twice.", "actions");
        }

        if (!_actions.TryAdd(action.Id, action))
        {
            throw new ArgumentException($"Duplicate action id '{action.Id}'.", "actions");
        }
    }
}
