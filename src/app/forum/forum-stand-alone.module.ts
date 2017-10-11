import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';


import { ForumComponent } from './forum.component';
import { NgbdModalAskInForum} from './forum.component';
import { SharedModule } from '../helpers/shared.module';
import { TruncateModule } from 'ng2-truncate';



@NgModule({
	imports: [
		CommonModule,
		SharedModule,
		TruncateModule,
		FormsModule,
		RouterModule
	],
	declarations: [ForumComponent, NgbdModalAskInForum],
	entryComponents: [
		NgbdModalAskInForum
	],
	exports: [ForumComponent]
})
export class ForumModuleStandAlone { }
