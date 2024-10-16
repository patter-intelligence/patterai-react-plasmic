/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-ts-comment */
export class SolargrafApiClient {
  baseUrl: string;
  authToken: any;
  constructor() {
    this.baseUrl = "https://public-api-sandbox.solargraf.com";
    this.authToken = "22999:34211337e8eaf83308ca4169f081c51389fba85d8b9b389fbd83c80bc881097e";
  }
  async _handleApiResponse(response: Response) {
    const rawBody = await response.text();
    let jsonBody;
    try {
      jsonBody = JSON.parse(rawBody);
      if(jsonBody.errors) throw jsonBody.errors;
      if(jsonBody.data)  jsonBody =jsonBody.data;
    } catch (err) {
      jsonBody = null;
    }
    if (!response.ok) {
      const errorDetails = {
        responseStatus: response.status,
      };
      if (jsonBody) {
            // @ts-ignore
        errorDetails.responseBody = jsonBody;
      } else if (rawBody) {
            // @ts-ignore
        errorDetails.response = rawBody;
      }

      console.error("Solargraf API Error", errorDetails);

      // throw new Meteor.Error("solargraf-error", undefined, JSON.stringify(errorDetails));
      throw errorDetails;
    }
    return jsonBody;
  }
  _get(url: string) {
    return fetch(`${this.baseUrl}${url}`, {
      headers: {
        Authorization: `Api-Key ${this.authToken}`,
      },
    }).then((res) => this._handleApiResponse(res));
  }
  _post(url: string, body: unknown) {
    return fetch(`${this.baseUrl}${url}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Api-Key ${this.authToken}`,
      },
      body: JSON.stringify(body),
    }).then((res) => this._handleApiResponse(res));
  }
  getProjectById(projectId: number) {
    console.log("getProject", projectId, "url: ", `/v1/projects/${projectId}`);
    return this._get(`/v1/projects/${projectId}`);
  }
  getPublicProject(publicProjectId: number) {
    console.log("getPublicProject", publicProjectId, "url: ", `/public/project/${publicProjectId}`);
    return this._get(`/public/project/${publicProjectId}`);
  }
  getDrawingsForProject(projectId: number) {
    console.log("getProjectDrawings", projectId, "url: ", `/v1/projects/${projectId}/drawings`);
    return this._get(`/v1/projects/${projectId}/drawings`);
  }
  getShadingReports(projectId: number, proposalId: number) {
    console.log("getShadingReports", projectId, proposalId, "url: ", `/v1/projects/${projectId}/proposals/${proposalId}/shadingReports?filter[status]=submitted&filter[type]=roof`);
    return this._get(`/v1/projects/${projectId}/proposals/${proposalId}/shadingReports?filter[status]=submitted&filter[type]=roof`);
  }
  getProductionForProject(publicProjectId: number) {
    console.log("getProjectProductions", publicProjectId, "url: ", `/v1/projects/${publicProjectId}/productions`);
    return this._get(`/v1/projects/${publicProjectId}/productions`);
  }
  createProject(project: number) {
    return this._post(`/v1/projects`, project);
  }
}