namespace IdleHold.Engine.Content;

/// <summary>
/// The static catalog of the game (actions and tools, and later items and skills).
/// It is validated once at construction so the engine can trust it afterwards.
/// </summary>
public sealed class GameContent
{
    private readonly Dictionary<string, ActionDefinition> _actions = new(StringComparer.Ordinal);
    private readonly Dictionary<string, ToolDefinition> _tools = new(StringComparer.Ordinal);

    public GameContent(IEnumerable<ActionDefinition> actions, IEnumerable<ToolDefinition>? tools = null)
    {
        foreach (var tool in tools ?? [])
        {
            AddTool(tool);
        }

        foreach (var action in actions)
        {
            AddAction(action);
        }
    }

    public IReadOnlyCollection<ActionDefinition> Actions => _actions.Values;

    public IReadOnlyCollection<ToolDefinition> Tools => _tools.Values;

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

    private void AddTool(ToolDefinition tool)
    {
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

    private void AddAction(ActionDefinition action)
    {
        if (action.Duration <= TimeSpan.Zero)
        {
            throw new ArgumentException($"Action '{action.Id}' must have a positive duration.", "actions");
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
