import { updateUserSection } from "@/Functions";
import { CurrUser } from "@/firebase";

// Types for activities
export const ActivityType = {
  PROJECT_ADD: "project_add",
  PROJECT_UPDATE: "project_update",
  PROJECT_DELETE: "project_delete",
  SKILL_ADD: "skill_add",
  SKILL_PROGRESS: "skill_progress",
  GOAL_REACHED: "goal_reached",
  GOAL_PROGRESS: "goal_progress",
  GOAL_ADD: "goal_add",
  SKILL_LEVEL_UP: "skill_level_up",
  MILESTONE_COMPLETED: "milestone_completed",
  STREAK_ACHIEVEMENT: "streak_achievement",
  PROJECT_STATUS_CHANGE: "project_status_change",
  GOAL_MILESTONE: "goal_milestone",
  SKILL_DELETE: "skill_delete",
  PROJECT_COMPLETED: "project_completed",
  GOAL_UPDATE: "goal_update",
  GOAL_DELETE: "goal_delete",
  RESOURCE_ADD: "resource_add",
  NOTE_ADD: "note_add",
};

// Icon mapping
export const ActivityIcons = {
  project_add: "bi bi-plus-circle",
  project_update: "bi bi-pencil",
  project_delete: "bi bi-trash",
  skill_add: "bi bi-lightning",
  skill_progress: "bi bi-graph-up",
  goal_reached: "bi bi-trophy",
  goal_progress: "bi bi-bullseye",
  goal_add: "bi bi-flag",
  skill_level_up: "bi bi-arrow-up",
  milestone_completed: "bi bi-flag",
  streak_achievement: "bi bi-fire",
  project_status_change: "bi bi-arrow-repeat",
  goal_milestone: "bi bi-flag",
  skill_delete: "bi bi-x-circle",
  project_completed: "bi bi-check-circle",
  goal_update: "bi bi-pencil-square",
  goal_delete: "bi bi-trash",
  resource_add: "bi bi-link",
  note_add: "bi bi-sticky",
};

// When updating a skill
const trackSkillProgress = async (skill, oldLevel) => {
  const activity = {
    type: ActivityType.SKILL_PROGRESS,
    description: `Progress in ${skill.name}: ${skill.level}`,
    timestamp: new Date().toISOString(),
    progress: skill.percentage,
  };

  await updateUserSection(
    CurrUser.value.uid,
    "recentActivity",
    activity,
    "add"
  );
};

// When reaching a goal
const trackGoalAchievement = async (goal) => {
  const activity = {
    type: ActivityType.GOAL_REACHED,
    description: `Goal achieved: ${goal.title}`,
    timestamp: new Date().toISOString(),
    achievementText: `🎉 Congratulations! Goal completed in ${calculateDuration(
      goal
    )}`
  };

  await updateUserSection(
    CurrUser.value.uid,
    "recentActivity",
    activity,
    "add"
  );
};

// When adding a project
const trackProjectAddition = async (project) => {
  const activity = {
    type: ActivityType.PROJECT_ADD,
    description: `New project created: ${project.name}`,
    timestamp: new Date().toISOString(),
  };

  await updateUserSection(
    CurrUser.value.uid,
    "recentActivity",
    activity,
    "add"
  );
};

// Track goal milestones
const trackGoalMilestone = async (goal, milestone) => {
  const activity = {
    type: ActivityType.GOAL_MILESTONE,
    description: `Milestone completed: ${milestone.title} (${goal.title})`,
    timestamp: new Date().toISOString(),
    progress: Math.round(
      (goal.milestones.filter((m) => m.completed).length /
        goal.milestones.length) *
        100
    )
  };

  await updateUserSection(
    CurrUser.value.uid,
    "recentActivity",
    activity,
    "add"
  );
};

// Track streak achievements
const trackStreakAchievement = async (goal) => {
  const milestones = [7, 14, 30, 60, 90]; // Streak milestones to track
  if (milestones.includes(goal.streak)) {
    const activity = {
      type: ActivityType.STREAK_ACHIEVEMENT,
      description: `${goal.streak} day streak on ${goal.title}!`,
      timestamp: new Date().toISOString(),
      achievementText: `🔥 ${goal.streak} consecutive days!`,
    };
    await updateUserSection(
      CurrUser.value.uid,
      "recentActivity",
      activity,
      "add"
    );
  }
};

// Track project status changes
const trackProjectStatusChange = async (project, oldStatus) => {
  const activity = {
    type: ActivityType.PROJECT_STATUS_CHANGE,
    description: `Project "${project.name}" changed from ${oldStatus} to ${project.status}`,
    timestamp: new Date().toISOString(),
  };

  await updateUserSection(
    CurrUser.value.uid,
    "recentActivity",
    activity,
    "add"
  );
};

// Track skill addition


/*const trackSkillAddition = async (skill) => {
  const futureDate = new Date();
  futureDate.setMonth(futureDate.getMonth() + 2);

  const activity = {
    type: ActivityType.SKILL_ADD,
    description: `Nouvelle compétence ajoutée: ${skill.name} de niveau ${skill.level}`,
    progress: skill.percentage,
    timestamp: futureDate.toISOString(),
  };
  await updateUserSection(
    CurrUser.value.uid,
    "recentActivity",
    activity,
    "add"
  );
};
*/ 
const trackSkillAddition = async (skill) => {
  const activity = {
    type: ActivityType.SKILL_ADD,
    description: `New skill added: ${skill.name} at level ${skill.level}`,
    progress: skill.percentage,
    timestamp: new Date().toISOString(),
  };
  await updateUserSection(
    CurrUser.value.uid,
    "recentActivity",
    activity,
    "add"
  );
};

const trackGoalAddition = async (goal) => {
  const activity = {
    type: ActivityType.GOAL_ADD,
    description: `New goal added: ${goal.title}`,
    timestamp: new Date().toISOString(),
  };
  await updateUserSection(
    CurrUser.value.uid,
    "recentActivity",
    activity,
    "add"
  );
};

// Track skill deletion
const trackSkillDeletion = async (skill) => {
  const activity = {
    type: ActivityType.SKILL_DELETE,
    description: `Skill deleted: ${skill.name}`,
    timestamp: new Date().toISOString(),
  };
  await updateUserSection(
    CurrUser.value.uid,
    "recentActivity",
    activity,
    "add"
  );
};

// Track project update
const trackProjectUpdate = async (project, changes) => {
  const activity = {
    type: ActivityType.PROJECT_UPDATE,
    description: `Project "${project.name}" updated`,
    timestamp: new Date().toISOString(),
    changes: changes, // Array of changed fields
  };
  await updateUserSection(
    CurrUser.value.uid,
    "recentActivity",
    activity,
    "add"
  );
};

// Track project completion
const trackProjectCompletion = async (project) => {
  const activity = {
    type: ActivityType.PROJECT_COMPLETED,
    description: `Project "${project.name}" completed`,
    timestamp: new Date().toISOString(),
    achievementText: "🎉 Project successfully completed!",
  };
  await updateUserSection(
    CurrUser.value.uid,
    "recentActivity",
    activity,
    "add"
  );
};

// Track project deletion
const trackProjectDeletion = async (project) => {
  const activity = {
    type: ActivityType.PROJECT_DELETE,
    description: `Project "${project.name}" deleted`,
    timestamp: new Date().toISOString(),
  };
  await updateUserSection(
    CurrUser.value.uid,
    "recentActivity",
    activity,
    "add"
  );
};

// Track goal update
const trackGoalUpdate = async (goal, changes) => {
  const activity = {
    type: ActivityType.GOAL_UPDATE,
    description: `Goal "${goal.title}" updated`,
    timestamp: new Date().toISOString(),
    changes: changes, // Array of changed fields
  };
  await updateUserSection(
    CurrUser.value.uid,
    "recentActivity",
    activity,
    "add"
  );
};

// Track goal deletion
const trackGoalDeletion = async (goal) => {
  const activity = {
    type: ActivityType.GOAL_DELETE,
    description: `Goal "${goal.title}" deleted`,
    timestamp: new Date().toISOString(),
  };
  await updateUserSection(
    CurrUser.value.uid,
    "recentActivity",
    activity,
    "add"
  );
};


// Helper function to calculate duration
const calculateDuration = (goal) => {
  const start = new Date(goal.createdAt);
  const end = new Date(goal.completedAt || new Date());
  const days = Math.floor((end - start) / (1000 * 60 * 60 * 24));

  if (days === 0) return "less than a day";
  if (days === 1) return "1 day";
  return `${days} days`;
};

export {
  trackSkillProgress,      // implemented
  trackGoalAchievement,    // implimented
  trackGoalAddition,       // implimented
  trackProjectAddition,    // implimented
  trackGoalMilestone,      // implimented
  trackStreakAchievement,  // implimented
  trackProjectStatusChange,// implimented 
  trackSkillAddition,      // implimented
  trackSkillDeletion,      // implimented
  trackProjectUpdate,      // implimented
  trackProjectCompletion,  // implimented
  trackProjectDeletion,    // implimented
  trackGoalUpdate,         // implimented
  trackGoalDeletion,       // implimented
};
