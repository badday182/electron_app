const express = require("express");
const cors = require("cors");

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Мок-данные для задач
const tasks = [
  {
    id: 1,
    title: "Изучить React",
    description: "Пройти курс по React и создать первое приложение",
    completed: false,
  },
  {
    id: 2,
    title: "Настроить Electron",
    description: "Изучить основы Electron и настроить окружение разработки",
    completed: true,
  },
  {
    id: 3,
    title: "Создать TODO приложение",
    description:
      "Разработать полнофункциональное TODO приложение с использованием React и Electron",
    completed: false,
  },
  {
    id: 4,
    title: "Добавить стили",
    description: "Улучшить внешний вид приложения с помощью CSS",
    completed: false,
  },
];

// Маршрут для получения всех задач
app.get("/tasks", (req, res) => {
  console.log("GET /tasks - возвращаем задачи");
  res.json(tasks);
});

// Маршрут для получения конкретной задачи
app.get("/tasks/:id", (req, res) => {
  const taskId = parseInt(req.params.id);
  const task = tasks.find((t) => t.id === taskId);

  if (task) {
    res.json(task);
  } else {
    res.status(404).json({ error: "Задача не найдена" });
  }
});

// Маршрут для создания новой задачи
app.post("/tasks", (req, res) => {
  const { title, description } = req.body;

  if (!title) {
    return res.status(400).json({ error: "Название задачи обязательно" });
  }

  const newTask = {
    id: Math.max(...tasks.map((t) => t.id)) + 1,
    title,
    description: description || "",
    completed: false,
  };

  tasks.push(newTask);
  res.status(201).json(newTask);
});

// Маршрут для обновления задачи
app.put("/tasks/:id", (req, res) => {
  const taskId = parseInt(req.params.id);
  const taskIndex = tasks.findIndex((t) => t.id === taskId);

  if (taskIndex === -1) {
    return res.status(404).json({ error: "Задача не найдена" });
  }

  const { title, description, completed } = req.body;

  if (title !== undefined) tasks[taskIndex].title = title;
  if (description !== undefined) tasks[taskIndex].description = description;
  if (completed !== undefined) tasks[taskIndex].completed = completed;

  res.json(tasks[taskIndex]);
});

// Маршрут для удаления задачи
app.delete("/tasks/:id", (req, res) => {
  const taskId = parseInt(req.params.id);
  const taskIndex = tasks.findIndex((t) => t.id === taskId);

  if (taskIndex === -1) {
    return res.status(404).json({ error: "Задача не найдена" });
  }

  const deletedTask = tasks.splice(taskIndex, 1)[0];
  res.json(deletedTask);
});

// Запуск сервера
app.listen(PORT, () => {
  console.log(`Сервер запущен на http://localhost:${PORT}`);
  console.log(`API доступно по адресу http://localhost:${PORT}/tasks`);
});
