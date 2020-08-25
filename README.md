# Shift_Into_Turbo2020


Turbo board is application with versatile functionality with two main parts being tracking and safety (speeding detection) Gps tracking system (keeptruckin in this case) is feeding current location, speed and driver information In order to meet the standards of trucking industry calculation of estimated arrival time has to take into considiration following:

    distance between origin and destination (mapquest api converting destination into coordinates, here maps api used for calculating the distance)
    timezone of destination (timezonedb api used to map timezone to destination)
    avaliable hours of service for a driver (fetching driver information from keeptruckin driver api and recalculating eta)
    different calculation for team and solo drivers. Destinations, target delivery times and additional info about the truck are stored in database.

This allows sending automatic tracking email via nodemailer and detecting delays in real time.

Speeding detection is using here api routing for vehicles in motion. Inspired by Samsara safety systems there are two differenet features implemented:

    email notification for driver on duty and safety managers if vehicle is over the limit for a certain period of time
    long term and daily scores kept and updated in database in order to follow general behaviour 

Project challenges: Planning out database structure and optimizing ReactJS

Technologies used: ReactJS, Node, MongoDB
