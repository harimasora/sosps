angular.module('starter.services', ['firebase'])

.service('Auth', function($firebaseAuth){
  return $firebaseAuth();
})
