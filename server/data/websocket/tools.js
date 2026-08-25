// функции websocket
const clients = new Set();
const black_clients = new Set();

if( black_clients.size > 0 ){
	black_clients.forEach((client)=>{
		exports.removeClient(client)
	})
}

exports.addClient = (socket) => {
	console.log(`[websocket] => addClient: + Клиент`);
	if( !clients.has(socket) ){
		clients.add(socket)
	}
	else{
		console.log(`[websocket] Попытка подключиться. Пользователь уже в сети.`)
	}
};

exports.removeClient = (socket) => {
	const deleted = clients.delete(socket);
	if( deleted ){
		console.log('[websocket] => removeClient: - Клиент"')
	}
	else{
		console.log('[websocket] => removeClient: Не смог удалить клиента из "clients"')
	}
};

exports.sendMessage = (data) => {
	// data бывает нескольких форматов: Buffer, string. 
	// Нужно проверять тщательно. + вывод в консоль не всегда корректный. 
	// Например: ('data = ', data) может отобразить, а (`data = ${data}`) - уже нет

	let normal_data;

	if( typeof data === 'string' ){
		try{
			normal_data = JSON.parse(data);
		}
		catch(err){
			console.log('[ws] Ошибка: ', err);
			return;
		}
	}
	else if( Buffer.isBuffer(data) ){
		try{
			normal_data = JSON.parse(data.toString('utf-8'));
		}
		catch(err){
			console.log('[ws] Ошибка: ', err);
			return;
		}
	}

	for( const client of clients ){
		if( client.readyState === 1 ){
			try{
				client.send(JSON.stringify(normal_data))
			}
			catch(err){
				console.log('[websocket] => sendMessage: Ошибка отправки клиенту: ', err);
				black_clients.add(client);
			}
		} 
	}
	console.log(`[websocket] => sendMessage: Сообщение [${data}] разослано подключённым клиентам`);
};

exports.getClientsSize = () => {
	return clients.size;
};