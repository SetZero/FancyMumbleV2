use directories::ProjectDirs;
use tauri::path::PathResolver;

const QUALIFIER: &str = "com";
const ORGANIZATION: &str = "fancy-mumble";
const APPLICATION: &str = "mumble-rs";

pub fn get_project_dirs() -> Option<ProjectDirs> {
    ProjectDirs::from(QUALIFIER, ORGANIZATION, APPLICATION)
}
