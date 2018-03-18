const { withFilter } = require('graphql-subscriptions')
const exit = require('@vue/cli-shared-utils/lib/exit')

const channels = require('./channels')

// Connectors
const cwd = require('./connectors/cwd')
const folders = require('./connectors/folders')
const projects = require('./connectors/projects')
const progress = require('./connectors/progress')
const logs = require('./connectors/logs')
const plugins = require('./connectors/plugins')
const tasks = require('./connectors/tasks')

// Prevent code from exiting server process
exit.exitProcess = false

process.env.VUE_CLI_API_MODE = true

module.exports = {
  Folder: {
    children: (folder, args, context) => folders.list(folder.path, context),
    isPackage: (folder, args, context) => folders.isPackage(folder.path, context),
    isVueProject: (folder, args, context) => folders.isVueProject(folder.path, context)
  },

  Project: {
    plugins: (project, args, context) => plugins.list(project.path, context)
  },

  Plugin: {
    version: (plugin, args, context) => plugins.getVersion(plugin, context),
    description: (plugin, args, context) => plugins.getDescription(plugin, context),
    logo: (plugin, args, context) => plugins.getLogo(plugin, context)
  },

  Query: {
    cwd: () => cwd.get(),
    consoleLogs: (root, args, context) => logs.list(context),
    consoleLogLast: (root, args, context) => logs.last(context),
    progress: (root, { id }, context) => progress.get(id, context),
    folderCurrent: (root, args, context) => folders.getCurrent(args, context),
    foldersFavorite: (root, args, context) => folders.listFavorite(context),
    projects: (root, args, context) => projects.list(context),
    projectCurrent: (root, args, context) => projects.getCurrent(context),
    projectCreation: (root, args, context) => projects.getCreation(context),
    pluginInstallation: (root, args, context) => plugins.getInstallation(context),
    plugin: (root, { id }, context) => plugins.findOne(id, context),
    tasks: (root, args, context) => tasks.list(context),
    task: (root, { id }, context) => tasks.findOne(id, context)
  },

  Mutation: {
    consoleLogsClear: (root, args, context) => logs.clear(context),
    folderOpen: (root, { path }, context) => folders.open(path, context),
    folderOpenParent: (root, args, context) => folders.openParent(cwd.get(), context),
    folderSetFavorite: (root, args, context) => folders.setFavorite({
      file: args.path,
      favorite: args.favorite
    }, context),
    presetApply: (root, { id }, context) => projects.applyPreset(id, context),
    featureSetEnabled: (root, args, context) => projects.setFeatureEnabled(args, context),
    promptAnswer: (root, { input }, context) => projects.answerPrompt(input, context),
    projectCreate: (root, { input }, context) => projects.create(input, context),
    projectImport: (root, { input }, context) => projects.import(input, context),
    projectOpen: (root, { id }, context) => projects.open(id, context),
    projectRemove: (root, { id }, context) => projects.remove(id, context),
    projectCwdReset: (root, args, context) => projects.resetCwd(context),
    projectSetFavorite: (root, args, context) => projects.setFavorite(args, context),
    pluginInstall: (root, { id }, context) => plugins.install(id, context),
    pluginUninstall: (root, { id }, context) => plugins.uninstall(id, context),
    pluginInvoke: (root, { id }, context) => plugins.runInvoke(id, context),
    pluginUpdate: (root, { id }, context) => plugins.update(id, context),
    taskRun: (root, { id }, context) => tasks.run(id, context),
    taskStop: (root, { id }, context) => tasks.stop(id, context),
    taskLogsClear: (root, { id }, context) => tasks.clearLogs(id, context)
  },

  Subscription: {
    cwdChanged: {
      subscribe: (parent, args, { pubsub }) => pubsub.asyncIterator(channels.CWD_CHANGED)
    },
    progressChanged: {
      subscribe: withFilter(
        // Iterator
        (parent, args, { pubsub }) => pubsub.asyncIterator(channels.PROGRESS_CHANGED),
        // Filter
        (payload, vars) => payload.progressChanged.id === vars.id
      )
    },
    progressRemoved: {
      subscribe: withFilter(
        // Iterator
        (parent, args, { pubsub }) => pubsub.asyncIterator(channels.PROGRESS_REMOVED),
        // Filter
        (payload, vars) => payload.progressRemoved.id === vars.id
      )
    },
    consoleLogAdded: {
      subscribe: (parent, args, context) => {
        logs.init(context)
        return context.pubsub.asyncIterator(channels.CONSOLE_LOG_ADDED)
      }
    },
    taskChanged: {
      subscribe: (parent, args, { pubsub }) => pubsub.asyncIterator(channels.TASK_CHANGED)
    },
    taskLogAdded: {
      subscribe: withFilter(
        (parent, args, { pubsub }) => pubsub.asyncIterator(channels.TASK_LOG_ADDED),
        (payload, vars) => payload.taskLogAdded.taskId === vars.id
      )
    }
  }
}
