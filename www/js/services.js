angular.module('starter.services', ['firebase'])

.service('Auth', ["$firebaseAuth", function($firebaseAuth) {
  return $firebaseAuth();
}])


// a factory to create a re-usable profile object
// we pass in a username and get back their synchronized data
.service("Profile", ["$firebaseObject", function($firebaseObject) {
  return function(uid) {
    // create a reference to the database node where we will store our data
    var ref = firebase.database().ref("users");
    var profileRef = ref.child(uid);

    // return it as a synchronized object
    return $firebaseObject(profileRef);
  }
}])

.service("HealthOperators", ["$firebaseArray", function($firebaseArray) {
  var helthOperatorsRef = firebase.database().ref().child("healthOperators");
  return $firebaseArray(helthOperatorsRef);
}])

.service("MobilityOptions", ["$firebaseArray", function($firebaseArray) {
  var mobilityOptionsRef = firebase.database().ref().child("mobilityOptions");
  return $firebaseArray(mobilityOptionsRef);
}])

  .service("Hospitals", ["$firebaseObject", "$firebaseArray", function($firebaseObject, $firebaseArray) {
    return function(id) {
      if (id) {
        // if a identifier is passed, return the hospital object
        var ref = firebase.database().ref("hospitals");
        var hospitalRef = ref.child(id);
        return $firebaseObject(hospitalRef);
      } else {
        // otherwise return an array
        var hospitalsRef = firebase.database().ref().child("hospitals");
        return $firebaseArray(hospitalsRef);
      }
    }
  }])
