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
      console.log("Authentication failed:", error);
      $ionicLoading.show({
        template: error.message
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
            $ionicLoading.show({
              template: 'Entrando...'
            });
            Auth.$signInWithEmailAndPassword($scope.user.email, $scope.user.password)
              .then(function (firebaseUser) {
                $ionicLoading.hide();
                redirectUser(firebaseUser)
              })
              .catch(function (error) {
                displayError(error)
              });
            break;
          } else {
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
        $ionicLoading.show({
          template: 'Cadastrando...'
        });
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
                      $ionicLoading.hide();
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
                  $ionicLoading.hide();
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

  .controller('HomeController', ["$scope", "HealthOperators", "currentAuth", "Profile",
    function($scope, HealthOperators, currentAuth, Profile) {

      $scope.user = Profile(currentAuth.uid);
      $scope.hospitals = HealthOperators();

      $scope.model = {
          'left':'100%',
          'opacity':'0',
          'leftNav':'100%'
      };

      $scope.search = function() {
        $scope.model.left = '0';
      };

      $scope.searchClose = function() {
        $scope.model.left = '100%';
      };

      $scope.closeNavigation = function() {
        $scope.model.opacity = '0';
        $scope.model.leftNav = '100%';
      };

      $scope.callNavigation = function() {
        $scope.model.opacity = '1';
        $scope.model.leftNav = '0';
      }
  }])

  .controller('HospitalsController', ["$scope", "$stateParams", "HealthOperators", "NgMap", "$cordovaLaunchNavigator", "$cordovaGeolocation", "$ionicLoading",
    function($scope, $stateParams, HealthOperators, NgMap, $cordovaLaunchNavigator, $cordovaGeolocation, $ionicLoading) {

      $scope.hospital = HealthOperators($stateParams.id);

      $scope.markers = [];

      //When the ng-map directive has an id attribute, the getMap function must use that id value as its first argument.
      NgMap.getMap("map").then(function(map) {

      }).catch(function(error){console.error(error)});

      $scope.getDirections = function() {
        $ionicLoading.show({
          template: "Aguarde..."
        });

        $cordovaGeolocation.getCurrentPosition()
          .then(function (position) {
            var current = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude
            };
            $cordovaLaunchNavigator.navigate([$scope.hospital.latitude, $scope.hospital.longitude], [current.latitude, current.longitude])
              .then(function(){
                $ionicLoading.hide();
              })
              .catch(function(error){displayError(error)});
          }, function(error) {
            displayError(error)
          });

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
      $scope.healthOperators = HealthOperators();
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
        $state.go('home')
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
      $scope.healthOperators = HealthOperators();
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
