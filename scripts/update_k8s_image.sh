#!/bin/bash
set -e

IMAGE_NAME="$1"
K8S_DEPLOYMENT_FILE="k8s/deployment.yml"

if [ -z "$IMAGE_NAME" ]; then
  echo "Usage: $0 <image_name:tag>"
  exit 1
fi

git config --global user.name 'GitHub Actions'
git config --global user.email 'actions@github.com'

# Обновляем только строку image для poster-ui (оставляем тег, который передали)
sed -i "s|image: .*poster-ui.*|image: ${IMAGE_NAME}|g" "${K8S_DEPLOYMENT_FILE}"

git add "${K8S_DEPLOYMENT_FILE}"
if git diff --staged --quiet; then
  echo "No changes to commit."
else
  git commit -m "Update Kubernetes image to ${IMAGE_NAME}"
fi
