// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.services' is found in services.js
// 'starter.controllers' is found in controllers.js
angular.module('starter', ['ionic', 'ionic-datepicker', 'starter.controllers', 'starter.services', 'ui.bootstrap', 'ngCordova', 'ngCordovaOauth', 'ngMap', 'firebase'])

  .run( ["$ionicPlatform", "$rootScope", "$state",
    function($ionicPlatform, $rootScope, $state) {
      $ionicPlatform.ready(function() {
        if(window.cordova && window.cordova.plugins.Keyboard) {
          // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
          // for form inputs)
          cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);

          // Don't remove this line unless you know what you are doing. It stops the viewport
          // from snapping when text inputs are focused. Ionic handles this internally for
          // a much nicer keyboard experience.
          cordova.plugins.Keyboard.disableScroll(true);
        }
        if(window.StatusBar) {
          StatusBar.styleDefault();
        }
      });

      $rootScope.$on("$stateChangeError", function(event, toState, toParams, fromState, fromParams, error) {
        // We can catch the error thrown when the $requireSignIn promise is rejected
        // and redirect the user back to the home page
        if (error === "AUTH_REQUIRED") {
          $state.go("login");
        }
      });
    }
  ])

  .config(function (ionicDatePickerProvider) {
    var datePickerObj = {
      inputDate: new Date(),
      setLabel: 'Escolher',
      todayLabel: 'Hoje',
      closeLabel: 'Cancelar',
      mondayFirst: false,
      weeksList: ["D", "S", "T", "Q", "Q", "S", "S"],
      monthsList: ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"],
      templateType: 'popup',
      from: new Date(1900, 8, 1),
      to: new Date(),
      showTodayButton: false,
      dateFormat: 'dd/MM/yyyy',
      closeOnSelect: false,
      disableWeekdays: [],
    };
    ionicDatePickerProvider.configDatePicker(datePickerObj);
  })

  .config( ["$stateProvider", "$urlRouterProvider",
    function($stateProvider, $urlRouterProvider) {
      $stateProvider
        .state('tutorial', {
          url: '/',
          templateUrl: 'templates/tutorial.html',
          controller: 'TutorialController',
          resolve: {
            // controller will not be loaded until $waitForSignIn resolves
            "currentAuth": ["Auth", function(Auth) {
              // $waitForSignIn returns a promise so the resolve waits for it to complete
              return Auth.$waitForSignIn();
            }]
          }
        })
        .state('login', {
          url: '/login',
          templateUrl: 'templates/login.html',
          controller: 'LoginController',
          resolve: {
            // controller will not be loaded until $waitForSignIn resolves
            "currentAuth": ["Auth", function(Auth) {
              // $waitForSignIn returns a promise so the resolve waits for it to complete
              return Auth.$waitForSignIn();
            }]
          }
        })
        .state("home", {
          url: '/home',
          controller: "HomeController",
          templateUrl: "templates/home.html",
          resolve: {
            // controller will not be loaded until $requireSignIn resolves
            "currentAuth": ["Auth", function(Auth) {
              // $requireSignIn returns a promise so the resolve waits for it to complete
              // If the promise is rejected, it will throw a $stateChangeError (see above)
              return Auth.$requireSignIn();
            }]
          }
        })
        .state("profile", {
          url: '/profile',
          controller: "ProfileController",
          templateUrl: "templates/profile.html",
          resolve: {
            "currentAuth": ["Auth", function(Auth) {
              return Auth.$requireSignIn();
            }]
          }
        })
        .state("settings", {
          url: '/settings',
          controller: "LoginController",
          templateUrl: "templates/settings.html",
          resolve: {
            "currentAuth": ["Auth", function(Auth) {
              return Auth.$requireSignIn();
            }]
          }
        })
        .state('staticInfo', {
          url: "/staticInfo",
          templateUrl: 'templates/staticInfo.html',
          controller: 'StaticInfoController',
          resolve: {
            "currentAuth": ["Auth", function(Auth) {
              return Auth.$requireSignIn();
            }]
          }
        })
        .state('hospitals', {
          url: "/hospitals/:id",
          templateUrl: 'templates/hospitals.html',
          controller: 'HospitalsController',
          resolve: {
            "currentAuth": ["Auth", function(Auth) {
              return Auth.$requireSignIn();
            }]
          }
        })
        .state('minions', {
          url: "/users/:userId/minions/:id",
          templateUrl: 'templates/minions.html',
          controller: 'MinionsController',
          resolve: {
            "currentAuth": ["Auth", function(Auth) {
              return Auth.$requireSignIn();
            }]
          }
        })
        .state('forgotPassword', {
          url: "/forgotPassword",
          templateUrl: 'templates/forgot.html',
          controller: 'ForgotController'
        });
      $urlRouterProvider.otherwise('/');
    }
  ]);
