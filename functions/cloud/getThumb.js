var config = require('../environments/environment');
var admin = require("firebase-admin");
var videoEditor = require('./helpers/videoEditor');


// var serviceAccount = require("../appEngine/dride-2384f-firebase-adminsdk-m1piu-fa5e93f5d8.json");

// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount),
//   apiKey: "AIzaSyDi0egNqUM-dZDjIiipjW-aSRYuXlFc3Ds",
//   authDomain: "dride-2384f.firebaseapp.com",
//   databaseURL: "https://dride-2384f.firebaseio.com",
//   projectId: "dride-2384f",
//   storageBucket: "dride-2384f.appspot.com",
//   messagingSenderId: "802741428178"
// });


getThumb = {
  dridifyVideo: function (uid, filename) {
    return new Promise((resolve, reject) => {

      /* 
       * get filename and token and generate a thumbnail for uploaded video
       * This api call generated by cloud function from Firebase
       */
      filename = filename + '.mp4';
      const path = '/tmp/'
      var promises = [];

      var video = new videoEditor(uid, filename, path);


      var timestamp = filename.split('.')[0]
      var bucketName = 'dride-2384f.appspot.com';

      var filePath = 'clips/' + uid + '/' + filename

      //download video file
	  const bucket = admin.storage().bucket();
	  
      let db = admin.database();


      bucket.file(filePath).download({
        destination: path + uid + '__' + filename
      }, function (err) {
        if (err) {
          reject(err)
		}
        video.prepareVideoToCloud().then(res => {
		  console.log('uploading..')
          video.uploadToBucket(path + uid + '_' + timestamp + '.jpg', 'thumbs/' + uid + '/' + timestamp + '.jpg').then(
            done => {
			  console.log('dont uploading thunmb..')
              promises.push(
                db.ref("clips").child(uid).child(timestamp).update({
                  'thumbs': {
					  "src": "https://firebasestorage.googleapis.com/v0/b/dride-2384f.appspot.com/o/thumbs%2F"+uid+"%2F"+timestamp+".jpg?alt=media"
				  }
                })
              )
			},
			error => console.error(error + '1')
          )

          promises.push(
            video.uploadToBucket(path + uid + '_' + timestamp + '.mp4', 'clips/' + uid + '/' + timestamp + '.mp4').then(
				done => {
					console.log('dont uploading video..')
					console.log(done)
				},
				error => console.error(error + '2')
			)
          )
		  console.log('ddff')
          Promise.all(promises).then(values => {
			console.log('uploaded!')
            resolve();
          });


        }, error => {
          reject(error)
        });


      })
    })
  }
}

module.exports = getThumb;
