#!/bin/bash
# As of Jan 2018, in order to allow the prometheus role to get google cloud info to auto scrape services,
# it is mandatory to add a custom-cluster-admin rolebinding *before* sourcing the prometheu-auth.yml file
# with kubect. Please change XXXXX with your user email address (Google Cloud)

kubectl create clusterrolebinding custom-cluster-admin --clusterrole=cluster-admin --user=XXXXX
