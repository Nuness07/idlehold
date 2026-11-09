using System.Net.Http.Json;
using IdleHold.Engine.Content;

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
    public async Task GetContent_ListsEverySkillInOrderWithItsCategory()
    {
        using var client = _factory.CreateClient();

        var content = await client.GetFromJsonAsync<ContentResponse>("/content");

        Assert.Equal(
            [
                new SkillDefinitionResponse("foraging", SkillCategory.Gathering),
                new SkillDefinitionResponse("woodcutting", SkillCategory.Gathering),
                new SkillDefinitionResponse("fishing", SkillCategory.Gathering),
                new SkillDefinitionResponse("mining", SkillCategory.Gathering),
                new SkillDefinitionResponse("crafting", SkillCategory.Production),
                new SkillDefinitionResponse("carpentry", SkillCategory.Production),
                new SkillDefinitionResponse("cooking", SkillCategory.Production),
            ],
            content!.Skills);
    }

    [Fact]
    public async Task GetContent_ListsTheRecipeGroupsInOrder_AndTheGroupOfEachAction()
    {
        using var client = _factory.CreateClient();

        var content = (await client.GetFromJsonAsync<ContentResponse>("/content"))!;

        Assert.Equal(
            [
                new RecipeGroupResponse("chipped-stone", "crafting"),
                new RecipeGroupResponse("stone", "crafting"),
                new RecipeGroupResponse("copper", "crafting"),
                new RecipeGroupResponse("campfire", "cooking"),
                new RecipeGroupResponse("stone-furnace", "cooking"),
            ],
            content.RecipeGroups);
        Assert.Equal("campfire", Assert.Single(content.Actions, action => action.Id == "cook-berry-soup").GroupId);
        Assert.Null(Assert.Single(content.Actions, action => action.Id == "cut-pine").GroupId);
    }

    [Fact]
    public async Task GetContent_WritesCategoriesAsNames()
    {
        using var client = _factory.CreateClient();

        var json = await client.GetStringAsync("/content");

        Assert.Contains("\"category\":\"gathering\"", json);
        Assert.Contains("\"category\":\"production\"", json);
    }

    [Fact]
    public async Task GetContent_ListsRecipeInputsAndTools()
    {
        using var client = _factory.CreateClient();

        var content = await client.GetFromJsonAsync<ContentResponse>("/content");

        var axe = Assert.Single(content!.Actions, action => action.Id == "craft-chipped-stone-axe");
        Assert.Equal([new ItemAmountResponse("twig", 3), new ItemAmountResponse("pebble", 2)], axe.Inputs);
        Assert.Contains(new ToolResponse("chipped-stone-axe", "axe", 1, "woodcutting"), content.Tools);
        Assert.Empty(Assert.Single(content.Actions, action => action.Id == "cut-pine").Inputs);
    }
}
