# datlaynk-modules

# todo

all the things

# warning

the production environment is currently set to disable guest access, as the only endpoints
that are publicly visible are things that wouldn't be accessible to the general public anyway

the dev configuration DOES allow for guest access, so ensure that anything you create is
tolerant of this (eg, use guards, and onInit->auth.subscribe in your components)
