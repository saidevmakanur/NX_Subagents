using TaskManager.Api.Models;

namespace TaskManager.Api.Repositories;

public class InMemoryTaskRepository : ITaskRepository
{
    private readonly List<TaskItem> _tasks = [];
    private readonly object _lock = new();

    public IReadOnlyList<TaskItem> GetAll()
    {
        lock (_lock)
        {
            return _tasks
                .OrderByDescending(t => t.CreatedAt)
                .ToList();
        }
    }

    public TaskItem Add(string text)
    {
        var task = new TaskItem
        {
            Id = Guid.NewGuid().ToString("N"),
            Text = text,
            Completed = false,
            CreatedAt = DateTime.UtcNow
        };

        lock (_lock)
        {
            _tasks.Insert(0, task);
        }

        return task;
    }

    public TaskItem? Update(string id, string text, bool completed)
    {
        lock (_lock)
        {
            var existing = _tasks.FirstOrDefault(t => t.Id == id);
            if (existing is null)
            {
                return null;
            }

            existing.Text = text;
            existing.Completed = completed;
            return existing;
        }
    }

    public bool Delete(string id)
    {
        lock (_lock)
        {
            var existing = _tasks.FirstOrDefault(t => t.Id == id);
            if (existing is null)
            {
                return false;
            }

            _tasks.Remove(existing);
            return true;
        }
    }
}
