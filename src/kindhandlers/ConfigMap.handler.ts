import * as k8s from '@kubernetes/client-node';

import navSectionNames from '@constants/navSectionNames';

import {ResourceKindHandler} from '@models/resourcekindhandler';

const ConfigMapHandler: ResourceKindHandler = {
  kind: 'ConfigMap',
  apiVersionMatcher: '**',
  navigatorPath: [navSectionNames.K8S_RESOURCES, navSectionNames.CONFIGURATION, 'ConfigMaps'],
  clusterApiVersion: 'v1',
  validationSchemaPrefix: 'io.k8s.api.core.v1',
  description: '',
  getResourceFromCluster(kubeconfig: k8s.KubeConfig, name: string, namespace: string): Promise<any> {
    const k8sCoreV1Api = kubeconfig.makeApiClient(k8s.CoreV1Api);
    return k8sCoreV1Api.readNamespacedConfigMap(name, namespace, 'true');
  },
  async listResourcesInCluster(kubeconfig: k8s.KubeConfig) {
    const k8sCoreV1Api = kubeconfig.makeApiClient(k8s.CoreV1Api);
    const response = await k8sCoreV1Api.listConfigMapForAllNamespaces();
    return response.body.items;
  },
  async deleteResourceInCluster(kubeconfig: k8s.KubeConfig, name: string, namespace?: string) {
    const k8sCoreV1Api = kubeconfig.makeApiClient(k8s.CoreV1Api);
    await k8sCoreV1Api.deleteNamespacedConfigMap(name, namespace || 'default');
  },
  helpLink: 'https://kubernetes.io/docs/concepts/configuration/configmap/',
};

export default ConfigMapHandler;
