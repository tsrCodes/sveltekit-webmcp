import { serverTool } from '#lib/server/index.js';
import { searchTodos } from './demo.remote.js';
import { searchTodosSchema } from './schemas.js';
import * as store from './store.server.js';

export const serverTools = [
	serverTool({
		name: 'list_todos',
		description: 'List the demo todos',
		readOnly: true,
		server: true,
		execute: () => store.listTodos()
	}),
	serverTool({
		name: 'search_todos',
		description: 'Search the demo todos by text',
		input: searchTodosSchema,
		readOnly: true,
		server: true,
		limit: { calls: 60, per: '1m' },
		// A real remote query, called on the server inside the request.
		execute: (input) => searchTodos(input)
	}),
	serverTool({
		name: 'reset_everything',
		description: 'Not served: server is false',
		server: false,
		execute: () => 'never runs'
	})
];
