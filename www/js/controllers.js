angular.module('starter.controllers', [])

  .controller('LoginController', ["$scope", "Auth", "Profile", "$state", "$cordovaOauth", "$ionicModal", "$ionicLoading",
    function($scope, Auth, Profile, $state, $cordovaOauth, $ionicModal, $ionicLoading) {

    var GOOGLE_CLIENT_ID = "160819131306-1u8d5p2bvfqb4et9mku0m9v8615tcjbd.apps.googleusercontent.com";
    var FACEBOOK_CLIENT_ID = "1873995172833205";

    $scope.user = {
      name: "",
      birth_date: "",
      email: "",
      password: ""
    };

    $ionicModal.fromTemplateUrl('templates/sign_up.html', {
      scope: $scope
    }).then(function(modal) {
      $scope.modal = modal;
    });

    function redirectUser(firebaseUser) {
      var user = firebaseUser.user ? firebaseUser.user : firebaseUser;

      // Create profile on /users
      $scope.profile = Profile(user.uid);

      $scope.profile.$loaded()
        .then(function () {

          $scope.profile.email = $scope.profile.email ? $scope.profile.email : user.email;
          $scope.profile.name = $scope.profile.name ? $scope.profile.name : user.displayName;
          $scope.profile.photoURL = $scope.profile.photoURL ? $scope.profile.photoURL : user.photoURL;

          $scope.profile.$save()
            .then(function() {
              $state.go('profile');
            })
            .catch(function(error) {
              displayError(error);
            });
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
              return Auth.$signInWithCredential(credentials);
            })
            .then(function (firebaseUser){
              redirectUser(firebaseUser)
            })
            .catch(function (error) {
              displayError(error)
            });
          break;
        case 'facebook':
          $cordovaOauth.facebook(FACEBOOK_CLIENT_ID, ["email", "public_profile"])
            .then(function(result) {
              var credentials = firebase.auth.FacebookAuthProvider.credential(result.access_token);
              return Auth.$signInWithCredential(credentials);
            })
            .then(function (firebaseUser){
              redirectUser(firebaseUser)
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

  }])

  .controller('HomeController', ["$scope", "currentAuth",
    function($scope, currentAuth) {
    // currentAuth (provided by resolve) will contain the
    // authenticated user or null if not signed in

    $scope.user = currentAuth;

  }])

  .controller('ProfileController', ["$scope", "currentAuth", "$state", "$ionicHistory", "Profile", "HealthOperators", "MobilityOptions",
    function($scope, currentAuth, $state, $ionicHistory, Profile, HealthOperators, MobilityOptions) {
      // currentAuth (provided by resolve) will contain the
      // authenticated user or null if not signed in

      $scope.user = Profile(currentAuth.uid);
      $scope.healthOperators = HealthOperators;
      $scope.mobilityOptions = MobilityOptions;

      // Turn firebase string date into a Date object
      $scope.user.$loaded().then(function() {
        $scope.user.birth_date = new Date($scope.user.birth_date);
      });

      $scope.discardChanges = function() {
        $ionicHistory.nextViewOptions({
          historyRoot: true
        });
        $state.go('home')
      };

      $scope.saveChanges = function() {
        //Transform Date object back to long
        $scope.user.birth_date = $scope.user.birth_date.getTime();

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

  }])
