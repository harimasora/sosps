angular.module('starter.controllers', [])

  .controller('BadgesCtrl', function($scope, $http, $ionicLoading) {
    $ionicLoading.show({
      template: 'Retrieving Badge Information...'
    });
    //Get profile information
    $http.get('https://teamtreehouse.com/harimasora.json').success(function (data, status, headers, config) {
      $ionicLoading.hide();
      // this callback will be called asynchronously
      // when the response is available
      $scope.badges = data.badges;
    }).error(function (data, status, headers, config) {
      $ionicLoading.hide();
      // called asynchronously if an error occurs
      // or server returns response with an error status.
      $ionicLoading.show({
        template: 'An error has retriving the profile!'
      });
      setTimeout(function () {
        $ionicLoading.hide();
      }, 4000)
    })
  })

  .controller('LoginController', function($scope, Auth, $state, $ionicModal) {

    $scope.user = {
      name: "",
      birthdate: "",
      email: "",
      password: ""
    }

    $scope.loginWithGoogle = function loginWithGoogle() {
      Auth.$signInWithPopup('google')
        .then(function(firebaseUser) {
          console.log("Signed in as: " + firebaseUser);
          $state.go('home');
        }).catch(function(error) {
          console.log("Authentication failed:", error);
        });;
    };

    $scope.loginWithEmailAndPassword = function() {
      Auth.$signInWithEmailAndPassword($scope.user.email, $scope.user.password)
      .then(function(firebaseUser){
        console.log("Signed in as: " + firebaseUser);
        $state.go('home');
      }).catch(function(error) {
        console.log("Authentication failed:", error);
      });
    }

    $scope.loginWithFacebook = function() {
      Auth.$signInWithPopup("facebook").then(function(firebaseUser) {
        console.log("Signed in as: " + firebaseUser);
        $state.go('home');
      }).catch(function(error) {
        console.log("Authentication failed:", error);
      });
    }

    $scope.createUser = function() {
      $scope.message = null;
      $scope.error = null;

      // Create a new user
      Auth.$createUserWithEmailAndPassword($scope.user.email, $scope.user.password)
        .then(function(firebaseUser) {
          console.log("Signed in as: " + firebaseUser);
          $state.go('home');
        }).catch(function(error) {
          console.log("Authentication failed:", error);
        });
    };

    $ionicModal.fromTemplateUrl('templates/sign_up.html', {
      scope: $scope
    }).then(function(modal) {
      $scope.modal = modal;
    });

  })

  .controller('SignUpController', function($scope) {

  })

  .controller('HomeController', function($scope, currentAuth) {

  })
