import { Injectable } from '@nestjs/common';

export type UserType = {
    _id: string;
    name: string;
    avatar?: string;
    token?: string;
};

@Injectable()
export class UsersService {
    private users: UserType[] = [
        { _id: '1', name: 'ali mirzaei', avatar: '', token: 'ExponentPushToken[itsAli]' },
        { _id: '2', name: 'Mohsen', avatar: '', token: 'ExponentPushToken[itsMohsen]' }
    ];

    getAllUsers(){
        return this.users
    };

    getUser(_id:string){
        return this.users.find(user => user._id === _id);
    };

    findUserByName(name:string){
        return this.users.find(user => user.name.toLocaleLowerCase() === name.toLocaleLowerCase());
    };

    setUsers(users: UserType[]) {
        this.users = users;
    };

    setUser(user: UserType) {
        const existUser = this.users?.find(e => e._id === user._id);
        if (existUser) {
            this.users = this.users.map(e => {
                if (e._id === existUser._id) {
                    return user
                } else {
                    return e
                }
            })
        } else {
            this.users.unshift(user);
        };
    };

    setDangeresUser(user: UserType) {
        this.users.push(user);
    };

    updateUsers(newUser: UserType) {
        this.users = this.users.map(user => {
            if (user._id === newUser._id) {
                return newUser;
            } else {
                return user
            };
        })
    };

    // fix
    searchFindUser({search,excludeName}:{search:string,excludeName:string}){
        return this.users.filter(e => e.name.toLocaleLowerCase().includes(search)).filter(e => e.name !== excludeName);
    }

    deleteUser(id:string){
        this.users = this.users.filter(user => user._id !== id);
    };
}
