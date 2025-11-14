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
