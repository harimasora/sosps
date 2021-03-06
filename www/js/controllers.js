angular.module('starter.controllers', [])

  .controller('LoginController', ["$scope", "Auth", "Profile", "PhotoStorage", "$state", "$ionicHistory", "$cordovaCamera", "$cordovaOauth", "$ionicModal", "$ionicLoading",
    function($scope, Auth, Profile, PhotoStorage, $state, $ionicHistory, $cordovaCamera, $cordovaOauth, $ionicModal, $ionicLoading) {

    var GOOGLE_CLIENT_ID = "160819131306-1u8d5p2bvfqb4et9mku0m9v8615tcjbd.apps.googleusercontent.com";
    var FACEBOOK_CLIENT_ID = "1873995172833205";

    $scope.user = {
      name: "",
      birth_date: "",
      email: "",
      password: "",
      photoUrl: ""
    };

    $scope.model = {
      'display':'none',
      'background-color':'red',
      'showLoading': false
    };

    $ionicModal.fromTemplateUrl('templates/sign_up.html', {
      scope: $scope
    }).then(function(modal) {
      $scope.modal = modal;
    });

    function hasAllInfo(user) {
      //return user.name && user.email && user.birth_date && user.healthOperator && user.address && user.mobilityOption;
      return user.name && user.email && user.birth_date && user.healthOperator && user.address;
    }

    function redirectUser(firebaseUser) {
      $scope.model.showLoading = true;
      var user = firebaseUser.user ? firebaseUser.user : firebaseUser;

      // Create profile on /users
      $scope.profile = Profile(user.uid);

      $scope.profile.$loaded()
        .then(function () {

          if (hasAllInfo($scope.profile)) {
            $ionicHistory.nextViewOptions({
              historyRoot: true
            });
            $scope.model.showLoading = false;
            $state.go('home');
          } else {
            $scope.profile.email = $scope.profile.email ? $scope.profile.email : user.email;
            $scope.profile.name = $scope.profile.name ? $scope.profile.name : user.displayName;
            $scope.profile.photoUrl = $scope.profile.photoUrl ? $scope.profile.photoUrl : user.photoURL;

            $scope.profile.$save()
              .then(function() {
                $scope.model.showLoading = false;
                $state.go('profile');
              })
              .catch(function(error) {
                displayError(error);
              });

          }
        })

    }

    function displayError(error) {
      $scope.model.showLoading = false;
      console.log("Authentication failed:", error);
      $ionicLoading.show({
        template: "erro de autenticação"
      });
      setTimeout(function () {
        $ionicLoading.hide();
      }, 4000)
    }

    $scope.loginWithProvider = function(provider) {

      switch (provider) {
        case 'google':
          $cordovaOauth.google(GOOGLE_CLIENT_ID, ["email", "profile"])
            .then(function(result) {
              var credentials = firebase.auth.GoogleAuthProvider.credential(result.id_token, result.access_token);
              Auth.$signInWithCredential(credentials)
                .then(function (firebaseUser){
                  redirectUser(firebaseUser)
                })
                .catch(function (error) {
                  displayError(error)
                });
            })
            .catch(function (error) {
              displayError(error)
            });
          break;
        case 'facebook':
          $cordovaOauth.facebook(FACEBOOK_CLIENT_ID, ["email", "public_profile"])
            .then(function(result) {
              var credentials = firebase.auth.FacebookAuthProvider.credential(result.access_token);
              Auth.$signInWithCredential(credentials)
                .then(function (firebaseUser){
                  redirectUser(firebaseUser)
                })
                .catch(function (error) {
                  displayError(error)
                });
            })
            .catch(function (error) {
              displayError(error)
            });
          break;
        case 'email':
          if ($scope.user && $scope.user.email && $scope.user.password) {
            $scope.model.showLoading = true;
            Auth.$signInWithEmailAndPassword($scope.user.email, $scope.user.password)
              .then(function (firebaseUser) {
                $scope.model.showLoading = false;
                redirectUser(firebaseUser)
              })
              .catch(function (error) {
                displayError(error)
              });

            break;
          } else {
            $scope.model.showLoading = false;
            $ionicLoading.show({
              template: "Combinação de email e senha inválidos."
            });
            setTimeout(function () {
              $ionicLoading.hide();
            }, 2000)
          }
      }

    };

    $scope.createUser = function() {
      if ($scope.user && $scope.user.name && $scope.user.email && $scope.user.password) {

        if ($scope.user.password.length < 6) {
          $scope.model.showLoading = false;
          $ionicLoading.show({
            template: "A senha deve ter no mínimo 6 caracteres."
          });
          setTimeout(function () {
            $ionicLoading.hide();
          }, 2000)
        }

        $scope.model.showLoading = true;
        // Create a new user
        Auth.$createUserWithEmailAndPassword($scope.user.email, $scope.user.password)
          .then(function(firebaseUser) {
            // Create profile on /users
            $scope.profile = Profile(firebaseUser.uid);
            $scope.profile.email = $scope.user.email;
            $scope.profile.name = $scope.user.name;
            $scope.profile.photoUrl = $scope.user.photoUrl;

            if ($scope.imageData) {
              PhotoStorage($scope.profile.$id).putString($scope.imageData, 'base64', {contentType: 'image/png'})
                .then(function(savedPicture) {

                  // DO NOT TOUCH HERE
                  $scope.profile.email = $scope.user.email;
                  $scope.profile.name = $scope.user.name;
                  $scope.profile.photoUrl = savedPicture.downloadURL;

                  $scope.profile.$save()
                    .then(function() {
                      $scope.model.showLoading = false;
                      $scope.modal.hide();
                      $state.go('profile');
                    })
                    .catch(function(error) {
                      displayError(error);
                    });
                })
                .catch(function(error){
                  displayError(error);
                })
            } else {
              $scope.profile.$save()
                .then(function() {
                  $scope.model.showLoading = false;
                  $scope.modal.hide();
                  $state.go('profile');
                })
                .catch(function(error) {
                  displayError(error);
                });
            }

          })
          .catch(function(error) {
            console.log("Authentication failed:", error);
          });
      } else {
        $scope.model.showLoading = false;
        $ionicLoading.show({
          template: "Preencha todos os campos."
        });
        setTimeout(function () {
          $ionicLoading.hide();
        }, 2000)
      }

    };

    $scope.takePhoto = function() {
      var options = {
        quality : 75,
        destinationType : Camera.DestinationType.DATA_URL,
        sourceType : Camera.PictureSourceType.PHOTOLIBRARY,
        allowEdit : true,
        encodingType: Camera.EncodingType.PNG,
        popoverOptions: CameraPopoverOptions,
        targetWidth: 150,
        targetHeight: 150,
        saveToPhotoAlbum: false
      };
      $cordovaCamera.getPicture(options).then(function(imageData) {
        $scope.imageData = imageData
      }, function(error) {
        console.error(error);
      });
    }

  }])

  .controller('HomeController', ["$scope", "Hospitals", "currentAuth", "Profile", "$cordovaSocialSharing", "$cordovaGeolocation", "$http", "$ionicHistory", "$state", "$q", "Auth", "$firebaseArray", "$firebaseObject", "$location",
    function($scope, Hospitals, currentAuth, Profile, $cordovaSocialSharing, $cordovaGeolocation, $http, $ionicHistory, $state, $q, Auth, $firebaseArray, $firebaseObject, $location) {

      var GOOGLE_DIRECTIONS_API_KEY = "AIzaSyBAaQ72jUCDMauAn8LyNT_VN0Ye0VyTVPc";

      $scope.model = {
        'bar':'option-selected',
        'left':'100%',
        'opacity':'0',
        'leftNav':'100%',
        'showFilterBox': false,
        'choice': 'totalTime',
        'distance': 30,
        'specialty': 'PSAdulto'
      };
      $scope.choices = [
        {
          name: "Menor tempo para 1º atendimento",
          value: 'totalTime'
        },
        {
          name: "Menor tempo de espera",
          value: 'watingTime'
        },
        {
          name: "Menor tempo de deslocamento",
          value: 'trafficTime'
        }
      ];
      $scope.distances = [
        {
          name: "15km",
          value: 15
        },
        {
          name: "30km",
          value: 30
        },
        {
          name: "50km",
          value: 50
        }
      ];

      $scope.user = Profile(currentAuth.uid);
      $scope.hospitals = Hospitals();
      $scope.hospitalsSafeCopy = {};

      $scope.$on("$ionicView.beforeEnter", function(event, data){
        // Recreate references, otherwise firebase burns your credentials
        var ref = firebase.database().ref("users");
        var profileRef = ref.child(Auth.$getAuth().uid);
        $scope.user = $firebaseObject(profileRef);
        var hospitalsRef = firebase.database().ref().child("hospitals");
        $scope.hospitals = $firebaseArray(hospitalsRef);
        $scope.hospitals.$loaded().then(function() {
          for (var i=0; i<$scope.hospitals.length; i++){
            var hospital = $scope.hospitals[i];
            if ($scope.hospitalsSafeCopy[hospital.$id]) {
              hospital.distance = $scope.hospitalsSafeCopy[hospital.$id].distance;
              hospital.trafficTime = $scope.hospitalsSafeCopy[hospital.$id].trafficTime;
              hospital.totalTime = $scope.hospitalsSafeCopy[hospital.$id].totalTime;
              hospital.updatedOn = $scope.hospitalsSafeCopy[hospital.$id].updatedOn;
              hospital.showBySpecialty = $scope.hospitalsSafeCopy[hospital.$id].showBySpecialty;
            }
          }
        });
      });

      var offsetRef = firebase.database().ref(".info/serverTimeOffset");

      var shareOptions = {
        message: 'Olha esse app, que legal! O aplicativo SOSPS monitora o tempo de espera para Pronto-Socorro Clínico Adulto e Infantil nos principais hospitais privados na Grande São Paulo.\n O aplicativo está disponível para Android e iOS.\n Veja o site: http://www.sosps.com.br.' , // not supported on some apps (Facebook, Instagram)
        subject: 'Olha que legal esse aplicativo', // fi. for email
        files: ['www/img/Default-736h.png'], // an array of filenames either locally or remotely
        url: '',
        chooserTitle: 'Onde compartilhar...' // Android only, you can override the default share sheet title
      };
      var onShareSuccess = function(result) {
        console.log("Share completed? " + result.completed); // On Android apps mostly return false even while it's true
        console.log("Shared to app: " + result.app); // On Android result.app is currently empty. On iOS it's empty when sharing is cancelled (result.completed=false)
      };
      var onShareError = function(msg) {
        console.log("Sharing failed with message: " + msg);
      };
      $scope.share = function() {
        $cordovaSocialSharing.shareWithOptions(shareOptions, onShareSuccess, onShareError);
      };

      var emailId = 'contato@sosps.com.br';
      var subjectAddHospital = 'Inclusão de Hospital';
      var messageAddHospital = "Indico a inclusão do seguinte hospital:%0D%0A%0D%0AHospital (indique o nome do hospital): %0D%0AEspecialidade (indique se Pronto-Socorro Clínico Adulto ou Infantil): %0D%0ACidade (indique o nome da cidade do hospital):";
      $scope.addHospitalMail = "mailto:"+ emailId + "?subject=" + subjectAddHospital + "&body=" + messageAddHospital;

      var contactEmailId = 'contato@sosps.com.br';
      var subjectContact = 'Contato SOSPS';
      var messageContact = '';
      $scope.contactMail = "mailto:"+ contactEmailId + "?subject=" + subjectContact + "&body=" + messageContact;

      $scope.toTutorial = function(){
        $ionicHistory.nextViewOptions({
          disableAnimate: true,
          disableBack: true,
          historyRoot: true
        });
        window.localStorage['didTutorial'] = "false";
        $state.go('tutorial');
      };

      $scope.signOut = function() {
        Auth.$signOut().then(function() {
          console.log('Signed Out');
          $ionicHistory.nextViewOptions({
            disableAnimate: true,
            disableBack: true,
            historyRoot: true
          });
          $scope.closeNavigation();
          $state.go('login');
        }, function(error) {
          console.error('Sign Out Error', error);
        });
      };

      $scope.doRefresh = function() {
        //console.log("Recarregando...");
        //console.log("Pegando posição do aparelho...");
        $q.all([$cordovaGeolocation.getCurrentPosition().then(function (position) {
          //console.log("Conseguiu!");
          var currentPos = position.coords.latitude + "," + position.coords.longitude;

          // Create a locationsArray with many hospitals sub arrays
          var locationsArray = [];
          var maxSize = 25;
          var locationsArraysSize = Math.ceil($scope.hospitals.length / maxSize);
          for (var i = 0; i < locationsArraysSize; i++) {
            var hospitalsSubArray = [];
            for (var j = i * maxSize; j < $scope.hospitals.length; j++) {
              if (j >= (i + 1) * maxSize) {
                continue;
              }
              if ($scope.hospitals[j].latitude && $scope.hospitals[j].longitude) {
                var distance = getDistanceFromLatLonInKm(position.coords.latitude, position.coords.longitude, $scope.hospitals[j].latitude, $scope.hospitals[j].longitude);
                $scope.hospitalsSafeCopy[$scope.hospitals[j].$id].distance = distance;
                if (distance <= $scope.model.distance) {
                  hospitalsSubArray.push($scope.hospitals[j]);
                }
              }
            }

            if (hospitalsSubArray.length > 0) {
              locationsArray.push(hospitalsSubArray);
            }
          }

          // Send requests to Directions API
          for (var i = 0; i < locationsArraysSize; i++) {
            var destinations = destinationString(locationsArray[i]);
            var url = requestDirectionUrl(currentPos, destinations, $scope.user.mobilityOption, GOOGLE_DIRECTIONS_API_KEY);
            sendRequest(url, locationsArray[i]);
          }

          return true;
        }).catch(function (error) {console.log(error)}), offsetRef.on("value", function (snap) {
            var offset = snap.val();
            var estimatedServerTimeMs = new Date().getTime() + offset;

            for (var i = 0; i < $scope.hospitals.length; i++) {

              //TODO GAMBIARRA ALERT!!!

              // Convert Firebase Timestamp to Date
              var timestampPSAdulto = $scope.hospitals[i].updateOn ? $scope.hospitals[i].updateOn['PSAdulto'] : null;
              var timestampPSPediatria = $scope.hospitals[i].updateOn ? $scope.hospitals[i].updateOn['PSPediatria'] : null;
              var timestampDatePSAdulto = new Date(timestampPSAdulto);
              var timestampDatePSPediatria = new Date(timestampPSPediatria);
              var updatedOn = {
                'PSAdulto': timestampDatePSAdulto,
                'PSPediatria': timestampDatePSPediatria
              };
              $scope.hospitals[i].updatedOn = updatedOn;
              $scope.hospitalsSafeCopy[$scope.hospitals[i].$id].updatedOn = updatedOn;

              // Set shouldShow attribute
              var hideHospital = !$scope.hospitals[i].shouldShow;

              var limitExceededPSAdulto = ((estimatedServerTimeMs - timestampPSAdulto) / (1000 * 60)) > 270; // Limit is 4.5h ~ 270 min
              var timestampInBoundsPSAdulto = 8 <= timestampDatePSAdulto.getHours() && timestampDatePSAdulto.getHours() < 21;
              var limitExceededPSPediatria = ((estimatedServerTimeMs - timestampPSPediatria) / (1000 * 60)) > 270; // Limit is 4.5h ~ 270 min
              var timestampInBoundsPSPediatria = 8 <= timestampDatePSPediatria.getHours() && timestampDatePSPediatria.getHours() < 21;
              var showBySpecialty = {
                'PSAdulto': !(limitExceededPSAdulto && timestampInBoundsPSAdulto && hideHospital),
                'PSPediatria': !(limitExceededPSPediatria && timestampInBoundsPSPediatria && hideHospital)
              };
              $scope.hospitals[i].showBySpecialty = showBySpecialty;
              $scope.hospitalsSafeCopy[$scope.hospitals[i].$id].showBySpecialty = showBySpecialty;
            }
          })])
          .then(function(result){
            // All good!
          })
          .catch(function(error){
            console.log(error);
          })
          .finally(function() {
            // Stop the ion-refresher from spinning
            $scope.$broadcast('scroll.refreshComplete');
          });
      };

      $scope.hospitals.$loaded().then(function() {

        // Make a hospitals coordinates array copy
        for(var i=0; i<$scope.hospitals.length; i++) {
          if ($scope.hospitals[i].latitude && $scope.hospitals[i].longitude) {
            $scope.hospitalsSafeCopy[$scope.hospitals[i].$id] = {latitude: $scope.hospitals[i].latitude, longitude: $scope.hospitals[i].longitude};
          }
        }

        // Get the user location
        $cordovaGeolocation.getCurrentPosition().then(function (position) {
          var currentPos = position.coords.latitude + "," + position.coords.longitude;

          // Create a locationsArray with many hospitals sub arrays
          var locationsArray = [];
          var maxSize = 25;
          var locationsArraysSize = Math.ceil($scope.hospitals.length / maxSize);
          for (var i = 0; i < locationsArraysSize; i++) {
            var hospitalsSubArray = [];
            for (var j = i * maxSize; j < $scope.hospitals.length; j++) {
              if (j >= (i + 1) * maxSize) {
                continue;
              }
              if ($scope.hospitals[j].latitude && $scope.hospitals[j].longitude) {
                var distance = getDistanceFromLatLonInKm(position.coords.latitude, position.coords.longitude, $scope.hospitals[j].latitude, $scope.hospitals[j].longitude);
                $scope.hospitalsSafeCopy[$scope.hospitals[j].$id].distance = distance;
                if (distance <= $scope.model.distance) {
                  hospitalsSubArray.push($scope.hospitals[j]);
                }
              }
            }

            if (hospitalsSubArray.length > 0) {
              locationsArray.push(hospitalsSubArray);
            }
          }

          // Send requests to Directions API
          for (var i = 0; i < locationsArraysSize; i++) {
            var destinations = destinationString(locationsArray[i]);
            var url = requestDirectionUrl(currentPos, destinations, $scope.user.mobilityOption, GOOGLE_DIRECTIONS_API_KEY);
            sendRequest(url, locationsArray[i]);
          }

          return true;
        }).catch(function (error) {console.log(error)});

        // Get server time
        offsetRef.on("value", function (snap) {
          var offset = snap.val();
          var estimatedServerTimeMs = new Date().getTime() + offset;

          for (var i = 0; i < $scope.hospitals.length; i++) {

            // Convert Firebase Timestamp to Date
            var timestampPSAdulto = $scope.hospitals[i].updateOn ? $scope.hospitals[i].updateOn['PSAdulto'] : null;
            var timestampPSPediatria = $scope.hospitals[i].updateOn ? $scope.hospitals[i].updateOn['PSPediatria'] : null;
            var timestampDatePSAdulto = new Date(timestampPSAdulto);
            var timestampDatePSPediatria = new Date(timestampPSPediatria);
            var updatedOn = {
              'PSAdulto': timestampDatePSAdulto,
              'PSPediatria': timestampDatePSPediatria
            };
            $scope.hospitals[i].updatedOn = updatedOn;
            $scope.hospitalsSafeCopy[$scope.hospitals[i].$id].updatedOn = updatedOn;

            // Set shouldShow attribute
            var hideHospital = !$scope.hospitals[i].shouldShow;

            var limitExceededPSAdulto = ((estimatedServerTimeMs - timestampPSAdulto) / (1000 * 60)) > 270; // Limit is 4.5h ~ 270 min
            var timestampInBoundsPSAdulto = 8 <= timestampDatePSAdulto.getHours() && timestampDatePSAdulto.getHours() < 21;
            var limitExceededPSPediatria = ((estimatedServerTimeMs - timestampPSPediatria) / (1000 * 60)) > 270; // Limit is 4.5h ~ 270 min
            var timestampInBoundsPSPediatria = 8 <= timestampDatePSPediatria.getHours() && timestampDatePSPediatria.getHours() < 21;
            var showBySpecialty = {
              'PSAdulto': !(limitExceededPSAdulto && timestampInBoundsPSAdulto && hideHospital),
              'PSPediatria': !(limitExceededPSPediatria && timestampInBoundsPSPediatria && hideHospital)
            };
            $scope.hospitals[i].showBySpecialty = showBySpecialty;
            $scope.hospitalsSafeCopy[$scope.hospitals[i].$id].showBySpecialty = showBySpecialty;

            // Reload distance from safeArray
            $scope.hospitals[i].distance = $scope.hospitalsSafeCopy[$scope.hospitals[i].$id].distance;
            $scope.hospitals[i].trafficTime = $scope.hospitalsSafeCopy[$scope.hospitals[i].$id].trafficTime;
            $scope.hospitals[i].totalTime = $scope.hospitalsSafeCopy[$scope.hospitals[i].$id].totalTime;
          }
        });
      });

      $scope.hospitals.$watch(function(event) {
        if(event.event == "child_added") {
          //console.log("ADDED!");
        }
        if(event.event == "child_changed") {
          //console.log("CHANGED!");
          offsetRef.on("value", function (snap) {
            var offset = snap.val();
            var estimatedServerTimeMs = new Date().getTime() + offset;

            // Convert Firebase Timestamp to Date
            var hospital = $scope.hospitals.$getRecord(event.key);
            var timestampPSAdulto = hospital.updateOn ? hospital.updateOn['PSAdulto'] : null;
            var timestampPSPediatria = hospital.updateOn ? hospital.updateOn['PSPediatria'] : null;
            var timestampDatePSAdulto = new Date(timestampPSAdulto);
            var timestampDatePSPediatria = new Date(timestampPSPediatria);
            hospital.updatedOn = {
              'PSAdulto': timestampDatePSAdulto,
              'PSPediatria': timestampDatePSPediatria
            };

            // Set shouldShow attribute
            var hideHospital = !hospital.shouldShow;

            var limitExceededPSAdulto = ((estimatedServerTimeMs - timestampPSAdulto) / (1000 * 60)) > 270; // Limit is 4.5h ~ 270 min
            var timestampInBoundsPSAdulto = 8 <= timestampDatePSAdulto.getHours() && timestampDatePSAdulto.getHours() < 21;
            var limitExceededPSPediatria = ((estimatedServerTimeMs - timestampPSPediatria) / (1000 * 60)) > 270; // Limit is 4.5h ~ 270 min
            var timestampInBoundsPSPediatria = 8 <= timestampDatePSPediatria.getHours() && timestampDatePSPediatria.getHours() < 21;
            hospital.showBySpecialty = {
              'PSAdulto': !(limitExceededPSAdulto && timestampInBoundsPSAdulto && hideHospital),
              'PSPediatria': !(limitExceededPSPediatria && timestampInBoundsPSPediatria && hideHospital)
            };

            // Reload distance from safeArray
            hospital.distance = $scope.hospitalsSafeCopy[event.key].distance;
            hospital.trafficTime = $scope.hospitalsSafeCopy[event.key].trafficTime;
            hospital.totalTime = $scope.hospitalsSafeCopy[event.key].totalTime;
          });
        }
      });

      function requestDirectionUrl(origin, destination, mobility, key) {
        var baseUrl = "https://maps.googleapis.com/maps/api/distancematrix/json";
        var origins = "?origins=" + origin;
        var destinations = "&destinations=" + destination;
        //var mode = mobility ? "&mode=" + mobility : "";
        var mode = "";
        var language = "&language=pt-BR";
        var apiKey = "&key=" + key;
        return  baseUrl + origins + destinations + mode + language + apiKey;
      }
      function destinationString(hospitalsSubArray) {
        var destinations = "";
        for (var i=0; i<hospitalsSubArray.length; i++) {
          destinations += hospitalsSubArray[i].latitude + "," + hospitalsSubArray[i].longitude + "|";
        }
        destinations = destinations.slice(0, -1);
        return destinations;
      }
      function sendRequest(url, hospitalArray) {
        //console.log("Enviando url... " + url);
        $http.get(url).then(function(response) {
          //console.log("Pegando elementos...");
          if (response.status == 200) {
            var apiResponse = response.data;
            var elements = apiResponse.rows[0].elements;
            for(var i=0; i<elements.length; i++) {
              if (elements[0].status == "OK") {
                //console.log("Elemento " + i);
                //console.log(elements[i]);
                var timeInSeconds = elements[i].duration.value;
                var distance = elements[i].distance.value;
                var id = hospitalArray[i].$id;
                var watingTime = $scope.hospitals.$getRecord(id).watingTime;
                $scope.hospitalsSafeCopy[id].trafficTime = timeInSeconds / 60;
                if (watingTime) {
                  var totalTime = {};
                  var watingTimeKeys = Object.keys(watingTime);
                  for (var j = 0; j < watingTimeKeys.length; j++) {
                    totalTime[watingTimeKeys[j]] = watingTime[watingTimeKeys[j]] + (timeInSeconds / 60);
                  }
                  $scope.hospitals.$getRecord(id).totalTime = totalTime;
                  $scope.hospitalsSafeCopy[id].totalTime = totalTime;
                } else {
                  $scope.hospitals.$getRecord(id).totalTime = {'PSAdulto': timeInSeconds / 60, 'PSPediatria': timeInSeconds / 60};
                  $scope.hospitalsSafeCopy[id].totalTime = {'PSAdulto': timeInSeconds / 60, 'PSPediatria': timeInSeconds / 60};
                }
                $scope.hospitals.$getRecord(id).distance = distance / 1000;
                $scope.hospitalsSafeCopy[id].distance = distance / 1000;
              }
            }
          } else {
            //console.log("Falhou.");
            console.log(response)
          }
        }, function(error){
          console.log(error);
        });
      }

      $scope.updateCountAndGo = function(id, specialty, trafficTime) {
        $scope.hospitalToIncrement = Hospitals(id);

        $scope.hospitalToIncrement.$loaded()
          .then(function() {
            $scope.hospitalToIncrement.clickLinkCount = $scope.hospitalToIncrement.clickLinkCount ? $scope.hospitalToIncrement.clickLinkCount + 1 : 1;
            $scope.hospitalToIncrement.$save()
              .then(function(){
                $location.url('hospitals/' + id + '?specialty=' + specialty + '&trafficTime=' + trafficTime);
              })
          });
      };

      $scope.search = function() {
        $scope.model.left = '0';
      };

      $scope.searchClose = function() {
        $scope.model.left = '100%';
        $scope.model.search.name = "";
      };

      $scope.closeNavigation = function() {
        $scope.model.opacity = '0';
        $scope.model.leftNav = '100%';
      };

      $scope.callNavigation = function() {
        $scope.model.opacity = '1';
        $scope.model.leftNav = '0';
      };

      $scope.toggleFilterBox = function() {
        $scope.model.showFilterBox = !$scope.model.showFilterBox;
        $scope.model.choice = $scope.model.choice ? $scope.model.choice : 'totalTime.PSAdulto';
        $scope.model.distance = $scope.model.distance ? $scope.model.distance : 30;
      };

      $scope.lesserThan = function(prop, val){
        return function(item){
          return item[prop] <= val;
        }
      };
      $scope.updateFilter = function(specialty) {
        $scope.model.specialty = specialty;
        if ($scope.model.choice.indexOf('totalTime') !== -1) {
          $scope.model.selectedChoice = 'totalTime.' + specialty;
        } else if ($scope.model.choice.indexOf('watingTime') !== -1) {
          $scope.model.selectedChoice = 'watingTime.' + specialty;
        } else if ($scope.model.choice.indexOf('trafficTime') !== -1) {
          $scope.model.selectedChoice = 'trafficTime';
        }
      };
      $scope.updateFilter($scope.model.specialty);

      function getDistanceFromLatLonInKm(lat1,lon1,lat2,lon2) {
        var R = 6371; // Radius of the earth in km
        var dLat = deg2rad(lat2-lat1);  // deg2rad below
        var dLon = deg2rad(lon2-lon1);
        var a =
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
            Math.sin(dLon/2) * Math.sin(dLon/2)
          ;
        var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        var d = R * c; // Distance in km
        return d;
      }
      function deg2rad(deg) {
        return deg * (Math.PI/180)
      }
  }])

  .controller('StaticInfoController', ["$scope", "$state", "$ionicHistory",
    function($scope, $state, $ionicHistory) {

      $scope.discardChanges = function() {
        $ionicHistory.nextViewOptions({
          historyRoot: true
        });
        $state.go('home')
      };

    }])

  .controller('SettingsController', ["$scope", "$state", "$ionicHistory",
      function($scope, $state, $ionicHistory) {

        $scope.discardChanges = function() {
          $ionicHistory.nextViewOptions({
            historyRoot: true
          });
          $state.go('home')
        };

      }])

  .controller('ForgotController', ["$scope", "$state", "$ionicHistory", "Auth","$ionicLoading",
      function($scope, $state, $ionicHistory, Auth, $ionicLoading) {

        $scope.user = {
          email: ""
        };

        $scope.forgotPassword = function() {

          if($scope.user.email == "") {
            $ionicLoading.show({
                template: 'Campo Vazio',
                duration: 1000
              }).then(function(){
                console.log("The loading indicator is  now displayed");
            });
          } else {
            Auth.$sendPasswordResetEmail($scope.user.email).then(function() {
              $ionicLoading.show({
                  template: 'Email Enviado',
                  duration: 1000
                }).then(function(){
                  console.log("The loading indicator is  now displayed");
              });
            }, function(error) {
              console.log(error);
            });
          }
        }

        $scope.discardChanges = function() {
          $ionicHistory.nextViewOptions({
            historyRoot: true
          });
          $state.go('login')
        };

      }])

  .controller('HospitalsController', ["$scope", "$stateParams", "Hospitals", "NgMap", "$cordovaLaunchNavigator", "$cordovaGeolocation", "$ionicLoading", "$location",
    function($scope, $stateParams, Hospitals, NgMap, $cordovaLaunchNavigator, $cordovaGeolocation, $ionicLoading, $location) {

      function formatVariables(){
        var searchObject = $location.search();
        $scope.hospital.trafficTime = searchObject.trafficTime;
        if ($scope.hospital.watingTime) {
          $scope.hospital.totalTime = parseInt($scope.hospital.trafficTime) + $scope.hospital.watingTime[searchObject.specialty];
        }
        $scope.hospital.watingTimeSpecialty = $scope.hospital.watingTime ? $scope.hospital.watingTime[searchObject.specialty] : null;
        $scope.hospital.updateOnSpecialty = $scope.hospital.updateOn ? $scope.hospital.updateOn[searchObject.specialty] : null;
      }

      $scope.$on("$ionicView.beforeEnter", function(event, data){
        formatVariables();
      });

      $scope.hospital = Hospitals($stateParams.id);

      $scope.hospital.$loaded().then(function(){
        formatVariables();
      });

      $scope.hospital.$watch(function(event){
        formatVariables();
      });

      $scope.markers = [];

      var styleArray = [ //any style array defined in the google documentation you linked
      {
        featureType: "all",
        stylers: [
          { saturation: -80 }
        ]
      },{
        featureType: "road.arterial",
        elementType: "geometry",
        stylers: [
          { hue: "#00ffee" },
          { saturation: 50 }
        ]
      },{
        featureType: "poi.business",
        elementType: "labels",
        stylers: [
          { visibility: "off" }
          ]
        }
      ];

    $scope.options = {
       styles: styleArray
    };

      //When the ng-map directive has an id attribute, the getMap function must use that id value as its first argument.
      NgMap.getMap("map").then(function(map) {

      }).catch(function(error){console.error(error)});

      $scope.getDirections = function() {
        $ionicLoading.show({
          template: "Aguarde..."
        });

        $cordovaGeolocation.getCurrentPosition()
          .then(function (position) {
            var current = [
              position.coords.latitude,
              position.coords.longitude
            ];

            var destination = [
              $scope.hospital.latitude,
              $scope.hospital.longitude
            ];

          $ionicLoading.hide();
          launchnavigator.navigate(destination,{start: current, appSelectionDialogHeader: "Escolha um aplicativo para iniciar a navegação"});

          })
          .catch(function(error){displayError(error)});
        };

      function displayError(error) {
        console.log("Authentication failed:", error);
        $ionicLoading.show({
          template: error.message
        });
        setTimeout(function () {
          $ionicLoading.hide();
        }, 4000)
      }

    }])

  .controller('ProfileController', ["$scope", "currentAuth", "$state", "$ionicHistory", "$ionicLoading", "$cordovaCamera", "Profile", "PhotoStorage", "HealthOperators", "MobilityOptions", "Auth", "$firebaseArray", "ionicDatePicker",
    function($scope, currentAuth, $state, $ionicHistory, $ionicLoading, $cordovaCamera, Profile, PhotoStorage, HealthOperators, MobilityOptions, Auth, $firebaseArray, ionicDatePicker) {
      // currentAuth (provided by resolve) will contain the
      // authenticated user or null if not signed in

      var ipObj1 = {
        callback: function (val) {  //Mandatory
          console.log('Return value from the datepicker popup is : ' + val, new Date(val));
          $scope.user.formatted_birth_date = new Date(val);
        }
        //disabledDates: [            //Optional
        //  new Date(2016, 2, 16),
        //  new Date(2015, 3, 16),
        //  new Date(2015, 4, 16),
        //  new Date(2015, 5, 16),
        //  new Date('Wednesday, August 12, 2015'),
        //  new Date("08-16-2016"),
        //  new Date(1439676000000)
        //],
        //from: new Date(2012, 1, 1), //Optional
        //to: new Date(2016, 10, 30), //Optional
        //inputDate: new Date(),      //Optional
        //mondayFirst: true,          //Optional
        //disableWeekdays: [0],       //Optional
        //closeOnSelect: false,       //Optional
        //templateType: 'popup'       //Optional
      };

      $scope.openDatePicker = function(){
        ionicDatePicker.openDatePicker(ipObj1);
      };

      $scope.$on("$ionicView.beforeEnter", function(event, data){
        $scope.user = Profile(Auth.$getAuth().uid);
        $scope.user.$loaded().then(function() {
          $scope.user.formatted_birth_date = new Date($scope.user.birth_date);
          $scope.healthOperators = $firebaseArray(firebase.database().ref().child("healthOperators"));
          $scope.mobilityOptions = $firebaseArray(firebase.database().ref().child("mobilityOptions"));
        });
      });

      $scope.user = Profile(currentAuth.uid);
      $scope.healthOperators = HealthOperators;
      $scope.mobilityOptions = MobilityOptions;

      // Turn firebase string date into a Date object
      $scope.user.$loaded().then(function() {
        $scope.user.formatted_birth_date = new Date($scope.user.birth_date);
      });

      $scope.upload = function() {
        var options = {
          quality : 75,
          destinationType : Camera.DestinationType.DATA_URL,
          sourceType : Camera.PictureSourceType.PHOTOLIBRARY,
          allowEdit : true,
          encodingType: Camera.EncodingType.JPEG,
          popoverOptions: CameraPopoverOptions,
          targetWidth: 150,
          targetHeight: 150,
          saveToPhotoAlbum: false
        };
        $cordovaCamera.getPicture(options).then(function(imageData) {
          $scope.user.photoUrl = imageData;
          $scope.user.$save().then(function() {
            //alert("Image has been uploaded");
          });
        }, function(error) {
          console.error(error);
        });
      };

      $scope.discardChanges = function() {
        $ionicHistory.nextViewOptions({
          historyRoot: true
        });
        $state.go('home', {}, {reload: true});
      };

      $scope.saveChanges = function() {
        //Transform Date object back to long
        var date = new Date($scope.user.formatted_birth_date);
        $scope.user.birth_date = date.getTime();

        if ($scope.user.name && $scope.user.email && $scope.user.birth_date && $scope.user.healthOperator && $scope.user.address ) {
          $scope.user.$save()
            .then(function() {
              $ionicHistory.nextViewOptions({
                historyRoot: true
              });
              $state.go('home', {}, {reload: true});
            })
            .catch(function(error) {
              displayError(error);
            });
        } else {
          var error = {
            message: 'Por favor preencha todos os campos'
          };
          displayError(error)
        }
      };

      function displayError(error) {
        $ionicLoading.show({
          template: error.message
        });
        setTimeout(function () {
          $ionicLoading.hide();
        }, 2000)
      }

  }])

  .controller('MinionsController', ["$scope", "$stateParams", "Profile", "Minions", "HealthOperators", "MobilityOptions", "$ionicHistory", "$ionicLoading",
    function($scope, $stateParams, Profile, Minions, HealthOperators, MobilityOptions, $ionicHistory, $ionicLoading) {

      $scope.minion = {
        name: null,
        email: null,
        birth_date: null,
        healthOperator: null,
        address: null,
        mobilityOption: null
      };

      $scope.user = Profile($stateParams.userId);
      $scope.minion = Minions($stateParams.userId, $stateParams.id);
      $scope.minionArray = Minions($stateParams.userId);
      $scope.healthOperators = HealthOperators;
      $scope.mobilityOptions = MobilityOptions;

      $scope.minion.$loaded().then(function() {
        $scope.minion.birth_date = new Date($scope.minion.birth_date);
      });

      $scope.addMinion = function() {
        $ionicLoading.show({
          template: "Salvando..."
        });

        //Transform Date object back to long
        var date = new Date($scope.minion.birth_date);
        $scope.minion.birth_date = date.getTime();

        // new minion
        if ($stateParams.id == "new") {
          $scope.minionArray.$add({
            name: $scope.minion.name,
            email: $scope.minion.email,
            birth_date: $scope.minion.birth_date,
            healthOperator: $scope.minion.healthOperator,
            address: $scope.minion.address,
            mobilityOption: $scope.minion.mobilityOption
          }).then(function(){$ionicLoading.hide(); $ionicHistory.goBack()}).catch(function(error){displayError(error);});
        } else {
          $scope.minion.$save().then(function(){$ionicLoading.hide(); $ionicHistory.goBack()}).catch(function(error){displayError(error);})
        }
      }

      $scope.removeMinion = function() {
        $scope.minion.$remove();
        $ionicHistory.goBack();
      };

      function displayError(error) {
        console.log("Authentication failed:", error);
        $ionicLoading.show({
          template: error.message
        });
        setTimeout(function () {
          $ionicLoading.hide();
        }, 4000)
      }

      $scope.goBack = function() {
        $ionicHistory.goBack();
      }

    }])

  .controller('TutorialController', ["$scope", "$state", "$ionicSlideBoxDelegate", function($scope, $state, $ionicSlideBoxDelegate){

    // Called to navigate to the main app
    $scope.startApp = function() {
      $state.go('home');

      // Set a flag that we finished the tutorial
      window.localStorage['didTutorial'] = true;
    };

    // No this is silly
    // Check if the user already did the tutorial and skip it if so
    if(window.localStorage['didTutorial'] === "true") {
      console.log('Skip intro');
      $scope.startApp();
    }
    else{
      //setTimeout(function () {
      //  navigator.splashscreen.hide();
      //}, 750);
    }


    // Move to the next slide
    $scope.next = function() {
      $ionicSlideBoxDelegate.next();
    };

    $scope.previous = function() {
      $ionicSlideBoxDelegate.previous();
    };

    // Called each time the slide changes
    $scope.slideChanged = function(index) {
      $scope.slideIndex = index;
    };
  }])
