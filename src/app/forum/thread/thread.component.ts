import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Location, LocationStrategy, PathLocationStrategy } from '@angular/common';

import { AuthService } from '../../auth.service';

import { AngularFireDatabase } from 'angularfire2/database';
import { AngularFireStorage } from 'angularfire2/storage';

import { introAnim } from '../../router.animations';

import { MixpanelService } from '../../helpers/mixpanel/mixpanel.service';

import { MetaService } from '../../helpers/meta/meta.service';
import { Observable } from 'rxjs/Observable';
import { NotificationsService } from 'angular2-notifications';
import { Md5 } from 'ts-md5/dist/md5';
import { SsrService } from '../../helpers/ssr/ssr.service';

@Component({
	selector: 'app-thread',
	templateUrl: './thread.component.html',
	styleUrls: ['./thread.component.scss'],
	animations: [introAnim]
})
export class ThreadComponent implements OnInit, OnDestroy {
	currentThread: Observable<any[]>;
	conversation: Observable<any[]>;
	public threadId: string;
	public conversationPreviusIsMine: Array<boolean> = [];
	private sub: any;
	public replyBox: string;
	public firebaseUser: any;
	public profilePic: string;

	uploadPercent = 0;

	constructor(
		private route: ActivatedRoute,
		public db: AngularFireDatabase,
		private location: Location,
		private router: Router,
		private auth: AuthService,
		public mixpanel: MixpanelService,
		private notificationsService: NotificationsService,
		private meta: MetaService,
		private storage: AngularFireStorage,
		public ssr: SsrService
	) {
		auth.getState().subscribe(user => {
			if (!user) {
				this.firebaseUser = null;
				return;
			}
			this.firebaseUser = user;
		});
	}

	ngOnInit() {
		// set meta tags
		this.meta.set('Thread on Dride Forum', '', 'article');

		this.sub = this.route.params.subscribe(params => {
			this.threadId = params['slug'].split('____').pop();

			// migrate to ___ in url
			if (this.threadId === params['slug']) {
				this.threadId = params['slug'].split('__').pop();
			}
			this.db
				.object<any>('/threads/' + this.threadId)
				.valueChanges()
				.subscribe(snapshot => {
					if (!snapshot) {
						this.router.navigate(['/page-not-found']);
					} else {
						// set meta tags
						this.meta.set(snapshot.title, snapshot.description, 'article');
					}
				});

			this.currentThread = this.db.object<any>('/threads/' + this.threadId).valueChanges();
			this.conversation = this.db.list('/conversations/' + this.threadId).valueChanges();

			this.conversation.subscribe(snapshot => {
				this.sideThreadByAuther(snapshot, this.conversationPreviusIsMine);
			});
		});
	}

	sideThreadByAuther(threadData, conversationPreviusIsMine) {
		let previusKey = null;

		threadData.forEach(function(k, key) {
			if (!key) {
				previusKey = key;
				return;
			}
			// if same author posted again
			if (threadData[key].autherId === threadData[previusKey].autherId) {
				conversationPreviusIsMine[previusKey] = true;
			} else {
				conversationPreviusIsMine[previusKey] = false;
			}
			previusKey = key;
		});
	}

	/*
	*  Will push a new conversation object to DB (Add a comment in threadId)
	*/
	send() {
		this.auth.verifyLoggedIn().then(res => {
			this.getUserData(this.firebaseUser.uid).subscribe((userData: any) => {
				if (this.replyBox) {
					this.db.list('conversations/' + this.threadId).push({
						autherId: this.firebaseUser.uid,
						auther: this.firebaseUser.displayName,
						pic: userData.photoURL,
						body: this.replyBox,
						timestamp: new Date().getTime(),
						fid: this.getFid()
					});

					this.replyBox = '';
					this.mixpanel.track('posted a comment', {});
				} else {
					this.notificationsService.success('Oops..', 'Please write something to post..', {
						timeOut: 3000,
						showProgressBar: true,
						pauseOnHover: true,
						clickToClose: true
					});
				}
			});
		});
	}

	getFid() {
		if (this.firebaseUser.providerData[0].providerId === 'facebook.com') {
			return this.firebaseUser.providerData[0].uid;
		} else {
			return null;
		}
	}

	openLogin() {
		this.auth.openLogin();
	}

	ngOnDestroy() {
		if (this.ssr.isBrowser()) {
			this.sub.unsubscribe();
		}
	}

	getUserData(uid) {
		return this.db.object<any>('/userData/' + uid).valueChanges();
	}

	uploadFile(event) {
		const file = event.target.files[0];
		const fileType = file.name.split('.').pop();
		const filePath = 'forum/' + this.firebaseUser.uid + '/' + Md5.hashStr(file.name) + '.' + fileType;
		const task = this.storage.upload(filePath, file);

		// observe percentage changes
		task.percentageChanges().subscribe(percent => {
			this.uploadPercent = percent;
			if (percent === 100) {
				setTimeout(() => {
					this.uploadPercent = 0;
				}, 2500);
			}
		});
		// get notified when the download URL is available
		task.downloadURL().subscribe(url => {
			console.log(url + '');
			if (!this.replyBox) {
				this.replyBox = '';
			}
			this.replyBox = this.replyBox.concat('\n![image](', url.toString(), ')');
		});
	}
}
