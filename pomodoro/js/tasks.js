/**
 * Tasks Module  
 * Manages task list and localStorage
 */

export class TaskManager {
    constructor() {
        this.tasks = [];
        this.loadTasks();
    }

    loadTasks() {
        const saved = localStorage.getItem('pomodoroTasks');
        if (saved) {
            this.tasks = JSON.parse(saved);
        }
    }

    saveTasks() {
        localStorage.setItem('pomodoroTasks', JSON.stringify(this.tasks));
    }

    addTask(text) {
        const task = {
            id: Date.now(),
            text: text,
            completed: false,
            pomodoros: 0,
            createdAt: new Date().toISOString()
        };

        this.tasks.unshift(task);
        this.saveTasks();
        return task;
    }

    deleteTask(id) {
        this.tasks = this.tasks.filter(t => t.id !== id);
        this.saveTasks();
    }

    toggleTask(id) {
        const task = this.tasks.find(t => t.id === id);
        if (task) {
            task.completed = !task.completed;
            this.saveTasks();
        }
        return task;
    }

    incrementPomodoro(id) {
        const task = this.tasks.find(t => t.id === id);
        if (task) {
            task.pomodoros++;
            this.saveTasks();
        }
        return task;
    }

    clearCompleted() {
        this.tasks = this.tasks.filter(t => !t.completed);
        this.saveTasks();
    }

    getActiveTasks() {
        return this.tasks.filter(t => !t.completed);
    }

    getCompletedTasks() {
        return this.tasks.filter(t => t.completed);
    }

    getTotalCount() {
        return this.tasks.length;
    }

    getActiveCount() {
        return this.getActiveTasks().length;
    }
}
