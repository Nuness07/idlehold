using System.Net.Http.Json;

namespace IdleHold.Api.Tests;

public sealed class ContentEndpointsTests(PostgresFixture database) : IClassFixture<PostgresFixture>, IDisposable
{
    private readonly ApiFactory _factory = new(database.ConnectionString);

    public void Dispose() => _factory.Dispose();

    [Fact]
    public async Task GetContent_ListsActionsWithDurations()
    {
        using var client = _factory.CreateClient();

        var content = await client.GetFromJsonAsync<ContentResponse>("/content");

        Assert.NotNull(content);
        var pine = Assert.Single(content.Actions, action => action.Id == "cut-pine");
        Assert.Equal(3000, pine.DurationMs);
        Assert.Equal("woodcutting", pine.SkillId);
    }

    [Fact]
    public async Task GetContent_ListsEverySkill()
    {
        using var client = _factory.CreateClient();

        var content = await client.GetFromJsonAsync<ContentResponse>("/content");

        var skills = content!.Actions.Select(action => action.SkillId).Distinct().Order();
        Assert.Equal(["crafting", "fishing", "foraging", "mining", "woodcutting"], skills);
    }

    [Fact]
    public async Task GetContent_ListsRecipeInputsAndTools()
    {
        using var client = _factory.CreateClient();

        var content = await client.GetFromJsonAsync<ContentResponse>("/content");

        var axe = Assert.Single(content!.Actions, action => action.Id == "craft-chipped-stone-axe");
        Assert.Equal([new ItemAmountResponse("twig", 3), new ItemAmountResponse("pebble", 2)], axe.Inputs);
        Assert.Contains(new ToolResponse("chipped-stone-axe", "axe", 1), content.Tools);
        Assert.Empty(Assert.Single(content.Actions, action => action.Id == "cut-pine").Inputs);
    }
}
