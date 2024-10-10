import { initPlasmicLoader } from "@plasmicapp/loader-react";

export const PLASMIC = initPlasmicLoader({
  projects: [
    {
      id: "sCa7vFNJdgVPr4b2nv3NAN",  // ID of a project you are using
      token: "Ewbdf48OrfDBBGKtzSHMDPY6j2yAscHx1PzmPROWN1PhpoX2j3GB6IyksiHBIMA5crJ4mOVXgIG4MsQ"  // API token for that project
    }
  ],
  // Fetches the latest revisions, whether or not they were unpublished!
  // Disable for production to ensure you render only published changes.
  preview: true,
});
