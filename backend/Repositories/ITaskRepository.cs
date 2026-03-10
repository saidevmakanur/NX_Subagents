using TaskManager.Api.Models;

namespace TaskManager.Api.Repositories;

public interface ITaskRepository
{
    IReadOnlyList<TaskItem> GetAll();
    TaskItem Add(string text);
    TaskItem? Update(string id, string text, bool completed);
    bool Delete(string id);
}
