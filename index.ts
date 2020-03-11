import * as core from '@actions/core';
import * as github from '@actions/github';
import { Context } from '@actions/github/lib/context';

let octokit:github.GitHub;
let context:Context;

function createPR(baseBranch:string, headBranch:string, title:string, body:string) {
    octokit.pulls.create({
        ...context.repo,
        base: baseBranch,
        head: headBranch,
        title,
        body,
    });
}

function createBranch(name:string) {
    octokit.git.createRef({
        ...context.repo,
        ref: 'ref/heads/' + name,
        sha: context.sha,
    });
}

async function run() {
    // TODO Get branches
    const fromBrach = core.getInput('from-branch');
    const toBranch = core.getInput('to-branch');
    const token = core.getInput('github-token');
    const autoMerge = core.getInput('auto-merge') == 'true' ? true : false;

    octokit = new github.GitHub(token);
    context = github.context;

    // TODO Compare branches
    const branchName = `merge-from-${fromBrach}-to-${toBranch}`;

    // TODO Merge branch if auto merge is on


    const inConflict = false;
    const headBranch = fromBrach; // TODO Straigth merge?
    const isExistingPR = false; // TODO

    // TODO Create merge branch if conflict or update existing branch
    createBranch(branchName);

    // Create PR if no auto merge or conflict
    if (!isExistingPR && (!autoMerge || inConflict)) {
        createPR(branchName, toBranch, 'TODO Title', 'TODO Body');
    }
}

run().catch(core.setFailed)
