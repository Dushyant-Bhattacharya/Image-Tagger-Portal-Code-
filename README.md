
# Image Tagging Portal

## Link - https://site3.deploymentarena.in/

## Tech Stack -
*  React ( Typescript )
*  MongoDB
*  Node JS
*  Express JS
*  Socket.io
*  Passport JS ( Google Strategy )
*  Tailwind CSS
*  Framer-motion
*  Ant Design
## Features -

* A real time app that assigns new images to currently active users in a Queue manner using Socke.io

* Secure user authentication using Passport JS
	
* Showing profile photo and email of all the active users on the UI ( top left button ).
   On hover / click , it will show the active user list

* Showing the total untagged image count.
* If same email login is made from multiple clients , the new user will see the option to “Logout From Everywhere” , which forces all the associated clients with same email to logout.

## Challenges Faced -

* Doing pagination once the total no. of unassigned images are <= 5

* Maintaing the queue and assigning images to users.

## Potential Improvements -

* Using redux toolkit for state management ( currently using Context API)
