import React, { useState } from "react";
import TodoList from "./TodoList";
import NewTodo from "./NewTodo";

function App() {
  type todo = { id: string; name: string };
  // const todos: todo[] = [];
  const [todos, setTodos] = useState<todo[]>([]);

  const addTodo = (todoName: string) => {
    const newTodo = { id: new Date().toLocaleString(), name: todoName };
    setTodos((prev) => {
      return [...prev, newTodo];
    });
  };

  const deleteTodo = (updatedTodos: todo[]) => {
    setTodos(updatedTodos);
  };
  return (
    <div>
      <NewTodo addTodo={addTodo} />
      <TodoList todos={todos} deleteTodo={deleteTodo} />
    </div>
  );
}

export default App;
