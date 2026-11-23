import { command, form, query } from '$app/server';
import { addTodoSchema, postSchema, searchTodosSchema } from './schemas.js';
import * as store from './store.server.js';

export const getTodos = query(async () => store.listTodos());

export const searchTodos = query(searchTodosSchema, async ({ query: text, limit }) =>
	store.searchTodos(text, limit)
);

export const addTodo = command(addTodoSchema, async ({ text }) => {
	const todo = store.addTodo(text);
	getTodos().refresh();
	return todo;
});

export const createPost = form(postSchema, async ({ title, content }) => {
	const post = store.addPost(title, content);
	return { id: post.id, title: post.title };
});
