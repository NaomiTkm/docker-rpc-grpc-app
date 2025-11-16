# docker-compose.yml for distribution
## Step 1
For users, create a docker-compose.yml file in your environment, copy and paste the following code in the yaml file that you have created
```
services:
  rpc-encode:
    image: naomitkm/rpc-encode:latest-v1.1
    container_name: rpc-encode
    ports:
      - "3001:3001"

  rpc-decode:
    image: naomitkm/rpc-decode:latest-v1.1
    container_name: rpc-decode
    ports:
      - "3002:3002"

  grpc-encode:
    image: naomitkm/grpc-encode:latest-v1.1
    container_name: grpc-encode
    ports:
      - "50051:50051"

  grpc-decode:
    image: naomitkm/grpc-decode:latest-v1.1
    container_name: grpc-decode
    ports:
      - "50052:50052"

  gateway:
    image: naomitkm/gateway:latest-v1.1
    container_name: gateway
    environment:
      RPC_URL: "http://rpc-encode:3001/encode"
      RPC_DECODE_URL: "http://rpc-decode:3002/decode"
      GRPC_ADDR: "grpc-encode:50051"
      GRPC_DECODE_ADDR: "grpc-decode:50052"
      PORT: "8080"
    depends_on:
      - rpc-encode
      - rpc-decode
      - grpc-encode
      - grpc-decode

  frontend:
    image: naomitkm/frontend:latest-v1.1
    container_name: frontend
    depends_on:
      - gateway
    ports:
      - "8088:80"

```
## Step 2
In your terminal, run:
> docker compose pull
> docker compose up -d

To verify whether the status of the docker containers:
> docker compose ps -a

## Step 3
Open a browser, visit: http://localhost:8088/


# Other Notes by Developer
```
1. Remote Connection to ubuntu
	- wsl -d Ubuntu-22.04
	- (On another terminal) ssh ubuntu@localhost OR ssh ubuntu@localhost -p 2222

2. ip addr show
	> inet 172.17.111.222/20 is the IP of the VM wsl ubuntu

cd RPC/
python3 -m venv .venv
source .venv/bin/activate
pip install --upgrade pip rpyc
python -m pip install --no-cache-dir -i https://pypi.org/simple rpyc
which rpyc_classic.py
	/home/ubuntu/RPC/.venv/bin/rpyc_classic.py
rpyc_classic.py --host 127.0.0.1 --port 18812


3. Docker commands
sudo docker compose build
sudo docker compose up -d
sudo docker compose ps


To run localhost:8088 : 
navigate to the directory: docker-rpc-grpc-app
sudo docker compose down
sudo docker compose up

To run 'http://172.17.111.222:8080/'
ubuntu@NTKM:~/rpc-vs-grpc-demo/services/rpc-service$ npm i
ubuntu@NTKM:~/rpc-vs-grpc-demo/services/grpc-service$ npm i,then npm start
ubuntu@NTKM:~/rpc-vs-grpc-demo/services/gateway$ npm start
ubuntu@NTKM:~/rpc-vs-grpc-demo/services/rpc-decode-service$ npm start
ubuntu@NTKM:~/rpc-vs-grpc-demo/services/grpc-decode-service$ npm start

curl -s -X POST http://localhost:8080/bench \
  -H "Content-Type: application/json" \
  -d '{"protocol":"rpc","op":"encode","text":"hello","iterations":5}'
```