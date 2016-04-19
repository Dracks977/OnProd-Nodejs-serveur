USE OnProd;

CREATE TABLE User
(
    ID INT PRIMARY KEY NOT NULL AUTO_INCREMENT,
    Nom CHAR(32),
    Prenom CHAR(32),
    Mail varchar(255),
    Pass varchar(300),
    Domaine varchar(255),
    Metier varchar(255),
    Adr varchar(255),
    Tel CHAR(10),
    Date_creation DATE,
    Date_modification DATE
);

CREATE TABLE r_table
(
    ID INT PRIMARY KEY NOT NULL AUTO_INCREMENT,
    Theme varchar(255),
    Sujet varchar(255),
    T_Date DATE,
    Heure time,
    Dur time,
    Nb_pmax int,
    Lat FLOAT(53),
    Lng FLOAT(53),
    Adr varchar(255),
    Descr varchar(255),
	Mail_p varchar(255),
    Date_creation DATE,
    Date_modification DATE
);

CREATE TABLE User_Table
(
    ID INT PRIMARY KEY NOT NULL AUTO_INCREMENT,
    ID_Table INT,
    ID_User INT,
    Date_creation DATE
);