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

  .controller('LoginController', function($scope, Auth, Profile, $state, $ionicModal, $ionicLoading) {

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
      var user = firebaseUser.user ? firebaseUser.user : firebaseUser

      // Create profile on /users
      $scope.profile = Profile(user.uid);

      $scope.profile.$loaded()
        .then(function () {

          console.log($scope.profile);

          $scope.profile.email = $scope.profile.email ? $scope.profile.email : user.email;
          $scope.profile.name = $scope.profile.name ? $scope.profile.name : user.displayName;

          $scope.profile.$save()
            .then(function() {
              $state.go('home');
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
          Auth.$signInWithPopup('google')
            .then(function (firebaseUser){redirectUser(firebaseUser)})
            .catch(function (error) {displayError(error)});
          break;
        case 'facebook':
          Auth.$signInWithPopup('facebook')
            .then(function (firebaseUser){redirectUser(firebaseUser)})
            .catch(function (error) {displayError(error)});
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
            $scope.profile.birth_date = $scope.user.birth_date;
            $scope.profile.$save()
              .then(function() {
                $ionicLoading.hide();
                $scope.modal.hide();})
              .catch(function(error) {
                displayError(error);});
            $state.go('home');
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

  })

  .controller('SignUpController', function($scope) {

  })

  .controller('HomeController', function($scope, currentAuth) {
    // currentAuth (provided by resolve) will contain the
    // authenticated user or null if not signed in

    $scope.user = currentAuth;

  })
