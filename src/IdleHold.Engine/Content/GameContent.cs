namespace IdleHold.Engine.Content;

/// <summary>
/// The static catalog of the game (actions, and later items, skills, recipes).
/// It is validated once at construction so the engine can trust it afterwards.
/// </summary>
public sealed class GameContent
{
    private readonly Dictionary<string, ActionDefinition> _actions = new(StringComparer.Ordinal);

    public GameContent(IEnumerable<ActionDefinition> actions)
    {
        foreach (var action in actions)
        {
            if (action.Duration <= TimeSpan.Zero)
            {
                throw new ArgumentException($"Action '{action.Id}' must have a positive duration.", nameof(actions));
            }

            if (action.OutputQuantity <= 0)
            {
                throw new ArgumentException($"Action '{action.Id}' must produce at least one item.", nameof(actions));
            }

            if (!_actions.TryAdd(action.Id, action))
            {
                throw new ArgumentException($"Duplicate action id '{action.Id}'.", nameof(actions));
            }
        }
    }

    public IReadOnlyCollection<ActionDefinition> Actions => _actions.Values;

    /// <summary>Returns the action with this id, or <c>null</c> if it does not exist.</summary>
    public ActionDefinition? FindAction(string id) =>
        _actions.GetValueOrDefault(id);

    /// <summary>Returns the action with this id, or throws if it does not exist.</summary>
    public ActionDefinition GetAction(string id) =>
        FindAction(id) ?? throw new KeyNotFoundException($"Unknown action '{id}'.");
}
