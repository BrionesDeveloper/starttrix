import 'zone.js'; 

import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { StartScreenComponent } from './app/features/start/start-screen.component';


bootstrapApplication(StartScreenComponent, appConfig)
  .catch(err => console.error(err));
