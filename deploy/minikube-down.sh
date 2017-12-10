#/bin/bash

NAMESPACE=sandbox

if [ $(minikube status | grep "minikube: Running" -c) -ne 0 ]
then
    kubectl delete -f deploy/rabbit-controller.yml --namespace=$NAMESPACE
    kubectl delete -f deploy/rabbit-service.yml --namespace=$NAMESPACE
    kubectl delete -f deploy/api.yml --namespace=$NAMESPACE
    kubectl delete -f deploy/worker.yml --namespace=$NAMESPACE
    kubectl delete service sandbox-api --namespace=$NAMESPACE
    minikube stop
fi
