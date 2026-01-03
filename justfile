
GROUP := "dad-group-7"
VERSION := "1.0.6"


kubectl-pods:
    kubectl get pods

kubectl-apply:
    kubectl apply -f deployment

kubectl-update:
    kubectl delete -f deployment
    kubectl apply -f deployment


all-build-push group=GROUP version=VERSION:
    just laravel-build {{group}} {{version}} && just laravel-push {{group}} {{version}}
    just vue-build {{group}} {{version}}     && just vue-push {{group}} {{version}}
    just ws-build {{group}} {{version}}      && just ws-push {{group}} {{version}}

laravel-build group=GROUP version=VERSION:
    docker build -t registry-172.22.21.115.sslip.io/{{group}}/api:v{{version}} --platform linux/amd64 \
    -f ./deployment/DockerfileLaravel ./api \
    --build-arg GROUP={{group}}
laravel-push group=GROUP version=VERSION:
    docker push registry-172.22.21.115.sslip.io/{{group}}/api:v{{version}}

vue-build group=GROUP version=VERSION:
    docker build -t registry-172.22.21.115.sslip.io/{{group}}/web:v{{version}} --platform linux/amd64 -f ./deployment/DockerfileVue ./frontend
vue-push group=GROUP version=VERSION:
    docker push registry-172.22.21.115.sslip.io/{{group}}/web:v{{version}}

ws-build group=GROUP version=VERSION:
    docker build -t registry-172.22.21.115.sslip.io/{{group}}/ws:v{{version}} --platform linux/amd64 -f ./deployment/DockerfileWS ./websockets
ws-push group=GROUP version=VERSION:
    docker push registry-172.22.21.115.sslip.io/{{group}}/ws:v{{version}}