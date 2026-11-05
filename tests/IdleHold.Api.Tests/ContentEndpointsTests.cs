using System.Net.Http.Json;

namespace IdleHold.Api.Tests;

public sealed class ContentEndpointsTests : IDisposable
{
    private readonly ApiFactory _factory = new();

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
}
