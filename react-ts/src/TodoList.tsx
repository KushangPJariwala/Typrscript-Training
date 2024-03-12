import React from "react";

type Props = {
  todos: { id: string; name: string }[];
  deleteTodo: (updatedTodos: any) => void;
};

export default function TodoList({ todos, deleteTodo }: Props) {
  console.log("todos", todos);

  const handleDelete = (id: string) => {
    const updatedTodos = todos.filter((todo) => todo.id !== id);
    deleteTodo(updatedTodos);
  };
  return (
    <div>
      {todos.map((todo) => (
        <>
          <li>
            {todo.name}{" "}
            <button onClick={() => handleDelete(todo.id)}>❌</button>
          </li>
        </>
      ))}
    </div>
  );
}
