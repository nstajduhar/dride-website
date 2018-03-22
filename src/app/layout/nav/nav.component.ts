import { Component, OnInit, Renderer } from '@angular/core';
import { Location } from '@angular/common';
import { Router } from '@angular/router';

import { AuthService } from '../../auth.service';
import { SsrService } from '../../helpers/ssr/ssr.service';

import { introAnim } from '../../router.animations';

import { NgbdModalLogin } from '../../auth.service';
import { NotificationsService } from 'angular2-notifications';
import { NgbdModalAskToSubscribe } from './askToSubscribe.modal';
import { BsModalService } from 'ngx-bootstrap/modal';
import { CookieService } from 'ngx-cookie-service';

@Component({
	selector: 'app-nav',
	templateUrl: './nav.component.html',
	styleUrls: ['./nav.component.scss'],
	animations: [introAnim]
})
export class NavComponent implements OnInit {
	firebaseUser: any;
	isCollapsed = true;
	isFixed = false;
	path = '';
	showOverlay = false;
	public forumBadge = 0;

	constructor(
		private auth: AuthService,
		private renderer: Renderer,
		public location: Location,
		public router: Router,
		private modalService: BsModalService,
		public ssr: SsrService,
		private cookieService: CookieService,
		private notificationsService: NotificationsService
	) {
		if (this.ssr.isBrowser()) {
			router.events.subscribe(val => {
				this.path = location.path();
				if (this.path !== '') {
					this.isFixed = false;
				} else {
					this.isFixed = true;
				}
			});
		}

		auth.getState().subscribe(user => {
			if (!user) {
				this.firebaseUser = null;
				return;
			}
			this.firebaseUser = user;
		});
	}

	login() {
		this.modalService.show(NgbdModalLogin);
	}

	setHeight(el, height) {
		if (!this.isCollapsed) {
			this.renderer.setElementStyle(el, 'height', height + 'px');
		}
	}

	logOut() {
		this.auth.logOut();
		this.notificationsService.success('Success', 'You\'ve been logged out successfully', {
			timeOut: 3000,
			showProgressBar: true,
			pauseOnHover: true,
			clickToClose: true
		});
	}
	ngOnInit() {}

	askToSubscribe() {
		if (!this.cookieService.get('subscribed')) {
			this.modalService.show(NgbdModalAskToSubscribe);
		}
	}

	getProfilePic() {
		if (this.firebaseUser.fid) {
			return 'https://graph.facebook.com/' + this.firebaseUser.fid + '/picture';
		} else {
			return this.firebaseUser.photoURL;
		}
	}
}
