using TaskManager.Api.Models;
using TaskManager.Api.Repositories;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddSingleton<ITaskRepository, InMemoryTaskRepository>();

builder.Services.AddCors(options =>
{
    options.AddPolicy("LocalFrontend", policy =>
    {
        policy
            .SetIsOriginAllowed(origin =>
            {
                if (origin == "null")
                {
                    return true;
                }

                if (!Uri.TryCreate(origin, UriKind.Absolute, out var uri))
                {
                    return false;
                }

                return uri.Host.Equals("localhost", StringComparison.OrdinalIgnoreCase)
                    || uri.Host.Equals("127.0.0.1", StringComparison.OrdinalIgnoreCase);
            })
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

var app = builder.Build();

app.UseSwagger();
app.UseSwaggerUI();
app.UseCors("LocalFrontend");

var tasks = app.MapGroup("/api/tasks");

tasks.MapGet("/", (ITaskRepository repository) => Results.Ok(repository.GetAll()));

tasks.MapPost("/", (CreateTaskRequest request, ITaskRepository repository) =>
{
    var text = request.Text?.Trim();
    if (string.IsNullOrWhiteSpace(text))
    {
        return Results.BadRequest(new { message = "Task text is required." });
    }

    var created = repository.Add(text);
    return Results.Created($"/api/tasks/{created.Id}", created);
});

tasks.MapPut("/{id}", (string id, UpdateTaskRequest request, ITaskRepository repository) =>
{
    var text = request.Text?.Trim();
    if (string.IsNullOrWhiteSpace(text))
    {
        return Results.BadRequest(new { message = "Task text is required." });
    }

    var updated = repository.Update(id, text, request.Completed);
    return updated is null
        ? Results.NotFound(new { message = "Task not found." })
        : Results.Ok(updated);
});

tasks.MapDelete("/{id}", (string id, ITaskRepository repository) =>
{
    return repository.Delete(id)
        ? Results.NoContent()
        : Results.NotFound(new { message = "Task not found." });
});

app.Run();
