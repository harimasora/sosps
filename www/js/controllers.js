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

    console.log($scope.model.display);

    $ionicModal.fromTemplateUrl('templates/sign_up.html', {
      scope: $scope
    }).then(function(modal) {
      $scope.modal = modal;
    });

    function hasAllInfo(user) {
      return user.name && user.email && user.birth_date && user.healthOperator && user.address && user.mobilityOption;
    }

    function redirectUser(firebaseUser) {
      var user = firebaseUser.user ? firebaseUser.user : firebaseUser;

      // Create profile on /users
      $scope.profile = Profile(user.uid);

      $scope.profile.$loaded()
        .then(function () {

          if (hasAllInfo($scope.profile)) {
            $ionicHistory.nextViewOptions({
              historyRoot: true
            });
            $state.go('home');
          } else {
            $scope.profile.email = $scope.profile.email ? $scope.profile.email : user.email;
            $scope.profile.name = $scope.profile.name ? $scope.profile.name : user.displayName;
            $scope.profile.photoUrl = $scope.profile.photoUrl ? $scope.profile.photoUrl : user.photoURL;

            $scope.profile.$save()
              .then(function() {
                $state.model.showLoading = false;
                $state.go('profile');
              })
              .catch(function(error) {
                displayError(error);
              });

          }
        })
        .catch(function(error) {
          displayError(error);
        });

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
      if ($scope.user && $scope.user.name && $scope.user.email && $scope.user.password && $scope.user.birth_date) {

        $scope.model.showLoading = true;
        // Create a new user
        Auth.$createUserWithEmailAndPassword($scope.user.email, $scope.user.password)
          .then(function(firebaseUser) {
            // Create profile on /users
            $scope.profile = Profile(firebaseUser.uid);
            $scope.profile.email = $scope.user.email;
            $scope.profile.name = $scope.user.name;
            $scope.profile.photoUrl = $scope.user.photoUrl;
            $scope.profile.birth_date = $scope.user.birth_date.getTime();

            if ($scope.imageData) {
              PhotoStorage($scope.profile.$id).putString($scope.imageData, 'base64', {contentType: 'image/png'})
                .then(function(savedPicture) {

                  // DO NOT TOUCH HERE
                  $scope.profile.email = $scope.user.email;
                  $scope.profile.name = $scope.user.name;
                  $scope.profile.photoUrl = savedPicture.downloadURL;
                  $scope.profile.birth_date = $scope.user.birth_date.getTime();

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

  .controller('HomeController', ["$scope", "Hospitals", "currentAuth", "Profile", "$cordovaSocialSharing", "$cordovaGeolocation", "$http",
    function($scope, Hospitals, currentAuth, Profile, $cordovaSocialSharing, $cordovaGeolocation, $http) {

      var GOOGLE_DIRECTIONS_API_KEY = "AIzaSyBAaQ72jUCDMauAn8LyNT_VN0Ye0VyTVPc";

      $scope.model = {
        'bar':'option-selected',
        'left':'100%',
        'opacity':'0',
        'leftNav':'100%',
        'showFilterBox': false,
        'choice': 'name',
        'distance': 20
      };

      var shareOptions = {
        message: 'Chega de sair de casa sem saber se os serviços de Pronto-Socorro estão cheios e quanto tempo vai demorar. O SOSPS monitora tempos para atendimento em PS Clínico Adulto e Infantil, nos principais hospitais privados na Grande São Paulo. Baixe o app em ', // not supported on some apps (Facebook, Instagram)
        subject: 'Conheça o aplicativo SOSPS', // fi. for email
        files: ['www/img/pino.png'], // an array of filenames either locally or remotely
        url: 'http://www.sosps.com.br',
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


      var emailId = 'sosps@gmail.com';
      var subjectAddHospital = 'Inclusão de Hospital';
      var messageAddHospital = 'Solicito a inclusão do hospital -NOME-, localizado na cidade -CIDADE-.';
      $scope.addHospitalMail = "mailto:"+ emailId + "?subject=" + subjectAddHospital + "&body=" + messageAddHospital;

      $scope.switchButton = function() {

        var optionadulto = angular.element(     document.querySelector( '.option-adulto' ) );

        var optioncrianca = angular.element(      document.querySelector( '.option-infantil' ) );


        optioncrianca.removeClass('option-selected');
        optionadulto.addClass('option-selected');

      };
      $scope.switchButton2 = function() {

        var optionadulto = angular.element(     document.querySelector( '.option-adulto' ) );

        var optioncrianca = angular.element(      document.querySelector( '.option-infantil' ) );


        optionadulto.removeClass('option-selected');
        optioncrianca.addClass('option-selected');

      };

      angular.element( document.querySelector( '#div1' ) );
      $scope.user = Profile(currentAuth.uid);
      $scope.hospitals = Hospitals();

      //TODO mudar o $loaded()
      $scope.hospitals.$loaded()
        .then(function() {

          // Get the user location
          $cordovaGeolocation.getCurrentPosition()
            .then(function (position) {
              var currentPos = position.coords.latitude + "," + position.coords.longitude;

              // Create a locationsArray with many hospitals sub arrays
              var locationsArray = [];
              var maxSize = 25;
              var locationsArraysSize = Math.ceil($scope.hospitals.length / maxSize);
              for (var i=0; i<locationsArraysSize; i++) {
                var hospitalsSubArray = [];
                for (var j=i*maxSize; j<$scope.hospitals.length; j++) {
                  if (j >= (i+1)*maxSize) {
                    continue;
                  }
                  if ($scope.hospitals[j].latitude && $scope.hospitals[j].longitude) {
                    hospitalsSubArray.push($scope.hospitals[j]);
                  }
                }

                if (hospitalsSubArray.length > 0) {
                  locationsArray.push(hospitalsSubArray);
                }
              }

              // Send requests to Directions API
              for(var i=0; i<locationsArraysSize; i++) {
                var destinations = destinationString(locationsArray[i]);
                var url = requestDirectionUrl(currentPos, destinations, $scope.user.mobilityOption, GOOGLE_DIRECTIONS_API_KEY);
                sendRequest(url, locationsArray[i]);
              }

            })
            .catch(function(error){displayError(error)});


          // Get server time
          var offsetRef = firebase.database().ref(".info/serverTimeOffset");
          offsetRef.on("value", function(snap) {
            var offset = snap.val();
            var estimatedServerTimeMs = new Date().getTime() + offset;

            for (var i=0; i<$scope.hospitals.length; i++) {

              // Convert Firebase Timestamp to Date
              var timestamp = $scope.hospitals[i].updateOn;
              var timestampDate = new Date(timestamp);
              $scope.hospitals[i].updatedOn = timestampDate;

              // Set shouldShow attribute
              var hideHospital = !$scope.hospitals[i].shouldShow;
              var limitExceeded = ((estimatedServerTimeMs - timestamp) / (1000 * 60)) > 270; // Limit is 4.5h ~ 270 min
              var timestampInBounds = 8 <= timestampDate.getHours() && timestampDate.getHours() < 21;
              $scope.hospitals[i].shouldShow = !(limitExceeded && timestampInBounds && hideHospital);
            }
          });
        });

      function requestDirectionUrl(origin, destination, mobility, key) {
        var baseUrl = "https://maps.googleapis.com/maps/api/distancematrix/json";
        var origins = "?origins=" + origin;
        var destinations = "&destinations=" + destination;
        var mode = mobility ? "&mode=" + mobility : "";
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
        $http.get(url).then(function(response) {
          if (response.status == 200) {
            var apiResponse = response.data;
            var elements = apiResponse.rows[0].elements;
            for(var i=0; i<elements.length; i++) {
              var timeInSeconds = elements[i].duration.value;
              var distance = elements[i].distance.value;
              var watingTime = $scope.hospitals.$getRecord(hospitalArray[i].$id).watingTime;
              $scope.hospitals.$getRecord(hospitalArray[i].$id).trafficTime = timeInSeconds / 60;
              if (watingTime) {
                $scope.hospitals.$getRecord(hospitalArray[i].$id).totalTime = watingTime + (timeInSeconds / 60);
              } else {
                $scope.hospitals.$getRecord(hospitalArray[i].$id).totalTime = timeInSeconds / 60;
              }
              $scope.hospitals.$getRecord(hospitalArray[i].$id).distance = distance / 1000;
            }
          }
        }, function(error){
          console.log(error);
        });
      }

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
      };

      $scope.lesserThan = function(prop, val){
        return function(item){
          return item[prop] <= val;
        }
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

      $scope.hospital = Hospitals($stateParams.id);

      $scope.hospital.$loaded().then(function(){
        $scope.hospital.trafficTime = $location.search().trafficTime;
        $scope.hospital.totalTime = parseInt($scope.hospital.trafficTime) + $scope.hospital.watingTime;
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
          launchnavigator.navigate(destination, current);

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

  .controller('ProfileController', ["$scope", "currentAuth", "$state", "$ionicHistory", "$ionicLoading", "$cordovaCamera", "Profile", "PhotoStorage", "HealthOperators", "MobilityOptions",
    function($scope, currentAuth, $state, $ionicHistory, $ionicLoading, $cordovaCamera, Profile, PhotoStorage, HealthOperators, MobilityOptions) {
      // currentAuth (provided by resolve) will contain the
      // authenticated user or null if not signed in

      $scope.user = Profile(currentAuth.uid);
      $scope.healthOperators = HealthOperators;
      $scope.mobilityOptions = MobilityOptions;

      // Turn firebase string date into a Date object
      $scope.user.$loaded().then(function() {
        $scope.user.birth_date = new Date($scope.user.birth_date);
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
      }

      $scope.discardChanges = function() {
        $ionicHistory.nextViewOptions({
          historyRoot: true
        });
        $state.go('login')
      };

      $scope.saveChanges = function() {
        //Transform Date object back to long
        var date = new Date($scope.user.birth_date);
        $scope.user.birth_date = date.getTime();

        $scope.user.$save()
          .then(function() {
            $ionicHistory.nextViewOptions({
              historyRoot: true
            });
            $state.go('home');
          })
          .catch(function(error) {
            displayError(error);
          });
      }

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
