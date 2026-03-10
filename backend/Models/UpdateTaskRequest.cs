namespace TaskManager.Api.Models;

public class UpdateTaskRequest
{
    public string Text { get; set; } = string.Empty;
    public bool Completed { get; set; }
}
