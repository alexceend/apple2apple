# Apple2Apple

Apple2Apple es una aplicación de escritorio para transferir archivos entre amigos mediante una arquitectura P2P híbrida.

La idea principal es que los archivos no se suban a un servidor central.
Se necesita un servidor de señalización para que dos clientes puedan encontrarse y establecer una conexión directa.

```text
App Electron A ───── signaling ───── NAS ───── signaling ───── App Electron B

App Electron A ─────────────── P2P / WebRTC ─────────────── App Electron B
```

## Visión del sistema

* Servidor de señalización WebSocket funcionando en un contenedor Docker de un servidor.
* App Electron con React y TypeScript.
* Configuración local de servidor y token.
* Conexión WebSocket desde la app Electron al servidor.
* Sistema `hello` para registrar un `routeId`.
* Sistema `relay` para reenviar mensajes entre peers conectados.
* WebRTC DataChannel.
* Transferencia de archivos por chunks.
* Lista local de amigos.
* Cifrado extremo a extremo.
* Firmas digitales.
* Reanudación de transferencias.

## Tecnologías usadas

### Desktop

* Electron
* React
* TypeScript
* Vite
* WebSocket
* WebRTC DataChannel

### Signal Server

* Node.js
* Fastify
* @fastify/websocket
* Docker
* Docker Compose
* Nginx Proxy Manager

## Arquitectura

```text
apps/desktop        → aplicación de escritorio
apps/signal-server  → servidor de señalización para la NAS
```

## Flujo de conexión

### 1. El cliente se conecta al servidor usando WebSocket
```text
wss://servidor/ws?token=TOKEN
```

Cliente manda:

```json
{
  "type": "hello",
  "routeId": "pc-ejemplo"
}
```

Server responde:

```json
{
  "type": "hello.ok",
  "routeId": "pc-ejemplo",
  "onlinePeers": x
}
```

### 2. Otro peer se conecta de la misma manera

### 3. Envío de relay de un cliente al otro

```json
{
  "type": "relay",
  "from": "pc-ejemplo",
  "to": "raspi-ejemplo",
  "envelope": {
    "type": "test",
    "message": "[contenido]"
  }
}
```


## Objetivo del relay : Intercambiar mensajes de signaling para WebRTC

```text
webrtc.offer
webrtc.answer
webrtc.ice
```
Tras establecer WebRTC, la transferencia entre clientes será P2P.


## Despliegue del signal-server

El servidor de señalización se despliega con Docker Compose.

```bash
docker compose up -d --build
```


Endpoint health:

```bash
curl http://[ip]:6767/health
```


## Ejecutar la app desktop

Entrar en la carpeta:

```bash
cd apps/desktop
```

Instalar dependencias:

```bash
npm install
```

Ejecutar en desarrollo:

```bash
npm run dev
```

## Compilar la app desktop

Build:

```bash
npm run build
```

Generar instalador o ejecutable, según la configuración de Electron Builder:

```bash
npm run dist
```

## Seguridad


* El servidor no guarda archivos, ni claves privadas ni lista de amigos. Es un punto de encuentro temporal
* Cada PC debe tener su propia identidad local y una lista de amigos.
* Las claves públicas de amigos deberán verificarse mediante fingerprint o QR.
* Los archivos deberán cifrarse extremo a extremo.
* Los mensajes importantes deberán ir firmados.

## Licencia

Pendiente de definir.
