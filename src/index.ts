import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';

import { INotebookTracker, NotebookPanel } from '@jupyterlab/notebook';

import { IETCJupyterLabNotebookStateProvider } from '@educational-technology-collective/etc_jupyterlab_notebook_state_provider';

import { IETCJupyterLabTelemetryLibraryFactory } from '@educational-technology-collective/etc_jupyterlab_telemetry_library';

import { INotebookEventMessage } from '@educational-technology-collective/etc_jupyterlab_telemetry_library/lib/types';

// import { ISettingRegistry } from '@jupyterlab/settingregistry';

import { requestAPI } from './handler';

const PLUGIN_ID = '@educational-technology-collective/jupyterlab_telemetry_alligator:plugin';

export class MessageAdapater {

  private _userId: string;
  private _etcJupyterLabNotebookStateProvider: IETCJupyterLabNotebookStateProvider;

  constructor(
    { etcJupyterLabNotebookStateProvider }:
      { etcJupyterLabNotebookStateProvider: IETCJupyterLabNotebookStateProvider }
  ) {

    this._etcJupyterLabNotebookStateProvider = etcJupyterLabNotebookStateProvider;

    let hubUser = document?.cookie?.split('; ')?.find(row => row.startsWith('hub_user='))?.split('=')[1];

    this._userId = hubUser ? hubUser : "UNDEFINED";

  }

  async adaptMessage(sender: any, data: INotebookEventMessage) {

    try {

      let notebookState = this._etcJupyterLabNotebookStateProvider.getNotebookState({
        notebookPanel: data.notebookPanel
      });

      let notebookPath = data.notebookPanel.context.path;

      let message: any = {
        'event_name': data.eventName,
        'cells': data.cells,
        ...notebookState,
        ...{
          user_id: this._userId,
          notebook_path: notebookPath
        }
      }

      if (data.meta) {

        message['meta'] = data.meta;
      }

      console.log('Request', message);

      let response = await requestAPI<any>('telemetry', { method: 'POST', body: JSON.stringify(message) });

      message = { ...message };

      delete message.notebook;
      delete message.cells;

      console.log('Response', {
        'response': response,
        'message': message
      });
    }
    catch (e) {

      console.error(e);
    }
  }
}

/**
 * Initialization data for the @educational-technology-collective/jupyterlab_telemetry_alligator extension.
 */
const plugin: JupyterFrontEndPlugin<void> = {
  id: PLUGIN_ID,
  autoStart: true,
  requires: [
    INotebookTracker,
    IETCJupyterLabNotebookStateProvider,
    IETCJupyterLabTelemetryLibraryFactory
  ],
  activate: (
    app: JupyterFrontEnd,
    notebookTracker: INotebookTracker,
    etcJupyterLabNotebookStateProvider: IETCJupyterLabNotebookStateProvider,
    etcJupyterLabTelemetryLibraryFactory: IETCJupyterLabTelemetryLibraryFactory,
  ) => {

    let messageAdapter: MessageAdapater;

    let telemetry = (async () => {
      try {

        await app.started;

        const VERSION = await requestAPI<string>('version')

        console.log(`${PLUGIN_ID}, ${VERSION}`);

        let result = await requestAPI<any>('telemetry');

        console.log('telemetry', result);

        if (!result.telemetry) {

          notebookTracker.widgetAdded.disconnect(onWidgetAdded, this);
        }

        return result.telemetry;
      }
      catch (e) {
        console.error(e);
        notebookTracker.widgetAdded.disconnect(onWidgetAdded, this);
        return false;
      }
    })();


    async function onWidgetAdded(sender: INotebookTracker, notebookPanel: NotebookPanel) {
      //  Handlers must be attached immediately in order to detect early events, hence we do not want to await the appearance of the Notebook.

      if (await telemetry) {

        if (!messageAdapter) {
          messageAdapter = new MessageAdapater({ etcJupyterLabNotebookStateProvider });
        }

        etcJupyterLabNotebookStateProvider.addNotebookPanel({ notebookPanel });

        let etcJupyterLabTelemetryLibrary = etcJupyterLabTelemetryLibraryFactory.create({ notebookPanel });

        etcJupyterLabTelemetryLibrary.notebookClipboardEvent.notebookClipboardCopied.connect(messageAdapter.adaptMessage, messageAdapter);
        etcJupyterLabTelemetryLibrary.notebookClipboardEvent.notebookClipboardCut.connect(messageAdapter.adaptMessage, messageAdapter);
        etcJupyterLabTelemetryLibrary.notebookClipboardEvent.notebookClipboardPasted.connect(messageAdapter.adaptMessage, messageAdapter);

        etcJupyterLabTelemetryLibrary.notebookVisibilityEvent.notebookVisible.connect(messageAdapter.adaptMessage, messageAdapter);
        etcJupyterLabTelemetryLibrary.notebookVisibilityEvent.notebookHidden.connect(messageAdapter.adaptMessage, messageAdapter);

        etcJupyterLabTelemetryLibrary.notebookOpenEvent.notebookOpened.connect(messageAdapter.adaptMessage, messageAdapter);
        etcJupyterLabTelemetryLibrary.notebookCloseEvent.notebookClosed.connect(messageAdapter.adaptMessage, messageAdapter);
        etcJupyterLabTelemetryLibrary.notebookSaveEvent.notebookSaved.connect(messageAdapter.adaptMessage, messageAdapter);
        etcJupyterLabTelemetryLibrary.notebookScrollEvent.notebookScrolled.connect(messageAdapter.adaptMessage, messageAdapter);

        etcJupyterLabTelemetryLibrary.activeCellChangeEvent.activeCellChanged.connect(messageAdapter.adaptMessage, messageAdapter);
        etcJupyterLabTelemetryLibrary.cellAddEvent.cellAdded.connect(messageAdapter.adaptMessage, messageAdapter);
        etcJupyterLabTelemetryLibrary.cellRemoveEvent.cellRemoved.connect(messageAdapter.adaptMessage, messageAdapter);
        etcJupyterLabTelemetryLibrary.cellExecutionEvent.cellExecuted.connect(messageAdapter.adaptMessage, messageAdapter);
        etcJupyterLabTelemetryLibrary.cellErrorEvent.cellErrored.connect(messageAdapter.adaptMessage, messageAdapter);

      }
    }

    notebookTracker.widgetAdded.connect(onWidgetAdded, this);


    // if (settingRegistry) {
    //   settingRegistry
    //     .load(plugin.id)
    //     .then(settings => {
    //       console.log('@educational-technology-collective/jupyterlab_telemetry_alligator settings loaded:', settings.composite);
    //     })
    //     .catch(reason => {
    //       console.error('Failed to load settings for @educational-technology-collective/jupyterlab_telemetry_alligator.', reason);
    //     });
    // }

    // requestAPI<any>('get_example')
    //   .then(data => {
    //     console.log(data);
    //   })
    //   .catch(reason => {
    //     console.error(
    //       `The jupyterlab_telemetry_alligator server extension appears to be missing.\n${reason}`
    //     );
    //   });
  }
};

export default plugin;
